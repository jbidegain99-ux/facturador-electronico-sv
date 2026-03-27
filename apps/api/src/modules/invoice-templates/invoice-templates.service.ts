import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateRenderService } from './template-render.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateConfigDto } from './dto/update-template-config.dto';
import {
  DEFAULT_TEMPLATE_CONFIG,
  validateTemplateConfig,
  type TemplateConfig,
} from './interfaces/template-config.interface';
import type { DteData } from '../dte/pdf.service';

@Injectable()
export class InvoiceTemplatesService {
  private readonly logger = new Logger(InvoiceTemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly renderService: TemplateRenderService,
  ) {}

  /**
   * List system templates + tenant's own templates.
   */
  async findAll(tenantId: string) {
    const templates = await this.prisma.invoiceTemplate.findMany({
      where: {
        OR: [{ tenantId }, { isSystem: true }],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        isDefault: true,
        isActive: true,
        dteType: true,
        version: true,
        parentId: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });

    return templates.map((t) => ({
      ...t,
      config: this.safeParseJson(t.config),
    }));
  }

  /**
   * Get a single template by ID (must belong to tenant or be system).
   */
  async findOne(id: string, tenantId: string) {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { isSystem: true }],
      },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return {
      ...template,
      config: this.safeParseJson(template.config),
    };
  }

  /**
   * Clone a system template for the tenant.
   */
  async cloneFromSystem(tenantId: string, dto: CreateTemplateDto) {
    const sourceTemplate = await this.prisma.invoiceTemplate.findFirst({
      where: { id: dto.sourceTemplateId, isSystem: true },
    });

    if (!sourceTemplate) {
      throw new NotFoundException(
        'Plantilla del sistema no encontrada para clonar',
      );
    }

    // Generate unique slug
    const baseSlug = sourceTemplate.slug;
    const existingCount = await this.prisma.invoiceTemplate.count({
      where: { tenantId, slug: { startsWith: baseSlug } },
    });
    const slug = existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : `${baseSlug}-custom`;

    const newTemplate = await this.prisma.invoiceTemplate.create({
      data: {
        tenantId,
        name: dto.name || `${sourceTemplate.name} (Personalizada)`,
        slug,
        description: sourceTemplate.description,
        isSystem: false,
        isDefault: false,
        isActive: true,
        config: sourceTemplate.config,
        htmlTemplate: sourceTemplate.htmlTemplate,
        cssStyles: sourceTemplate.cssStyles,
        parentId: sourceTemplate.id,
        dteType: dto.dteType || null,
        version: 1,
      },
    });

    this.logger.log(
      `Template cloned: ${newTemplate.id} from ${sourceTemplate.id} for tenant ${tenantId}`,
    );

    return {
      ...newTemplate,
      config: this.safeParseJson(newTemplate.config),
    };
  }

  /**
   * Update the config JSON of a tenant template (deep merge).
   */
  async updateConfig(
    id: string,
    tenantId: string,
    dto: UpdateTemplateConfigDto,
  ) {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id, tenantId, isSystem: false },
    });

    if (!template) {
      throw new NotFoundException(
        'Plantilla no encontrada o no es editable (las plantillas del sistema son de solo lectura)',
      );
    }

    // Build partial config from DTO
    const partialConfig: Partial<TemplateConfig> = {};
    if (dto.colors) partialConfig.colors = dto.colors as TemplateConfig['colors'];
    if (dto.fonts) partialConfig.fonts = dto.fonts as TemplateConfig['fonts'];
    if (dto.logo) partialConfig.logo = dto.logo as TemplateConfig['logo'];
    if (dto.sections) partialConfig.sections = dto.sections as TemplateConfig['sections'];
    if (dto.pageSettings) partialConfig.pageSettings = dto.pageSettings as TemplateConfig['pageSettings'];

    // Validate
    const errors = validateTemplateConfig(partialConfig);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // Deep merge with existing config
    const existingConfig = this.safeParseJson(template.config) as Record<string, unknown>;
    const mergedConfig = this.renderService.deepMerge(
      existingConfig,
      partialConfig as unknown as Record<string, unknown>,
    );

    const updated = await this.prisma.invoiceTemplate.update({
      where: { id },
      data: {
        config: JSON.stringify(mergedConfig),
        version: { increment: 1 },
      },
    });

    return {
      ...updated,
      config: this.safeParseJson(updated.config),
    };
  }

  /**
   * Set a template as the default for the tenant.
   */
  async setDefault(id: string, tenantId: string) {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Use transaction to unset previous default and set new one
    await this.prisma.$transaction(async (tx) => {
      // Unset existing defaults for this tenant (matching dteType)
      await tx.invoiceTemplate.updateMany({
        where: {
          tenantId,
          isDefault: true,
          dteType: template.dteType,
        },
        data: { isDefault: false },
      });

      // If it's a system template, clone it first
      if (template.isSystem) {
        const existingCount = await tx.invoiceTemplate.count({
          where: { tenantId, slug: { startsWith: template.slug } },
        });
        const slug = existingCount > 0
          ? `${template.slug}-${existingCount + 1}`
          : `${template.slug}-default`;

        await tx.invoiceTemplate.create({
          data: {
            tenantId,
            name: template.name,
            slug,
            description: template.description,
            isSystem: false,
            isDefault: true,
            isActive: true,
            config: template.config,
            htmlTemplate: template.htmlTemplate,
            cssStyles: template.cssStyles,
            parentId: template.id,
            dteType: template.dteType,
            version: 1,
          },
        });
      } else {
        await tx.invoiceTemplate.update({
          where: { id },
          data: { isDefault: true },
        });
      }
    });

    return { message: 'Plantilla establecida como predeterminada' };
  }

  /**
   * Delete a tenant template (not system templates).
   */
  async remove(id: string, tenantId: string) {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    if (template.isSystem) {
      throw new BadRequestException(
        'No se pueden eliminar plantillas del sistema',
      );
    }

    if (template.isDefault) {
      throw new ConflictException(
        'No se puede eliminar la plantilla predeterminada. Establezca otra como predeterminada primero.',
      );
    }

    await this.prisma.invoiceTemplate.delete({ where: { id } });

    return { message: 'Plantilla eliminada' };
  }

  /**
   * Generate a preview PDF for a template using sample DTE data.
   */
  async preview(id: string, tenantId: string): Promise<Buffer> {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const config = this.safeParseJson(template.config) as TemplateConfig;
    const sampleData = this.getSampleDteData(tenantId);

    const html = await this.renderService.compileHtmlFromTemplate(
      template.htmlTemplate,
      { ...DEFAULT_TEMPLATE_CONFIG, ...config },
      sampleData,
    );

    return this.renderService.generatePdf(html, config.pageSettings);
  }

  private safeParseJson(json: string): unknown {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }

  private getSampleDteData(tenantId: string): DteData {
    return {
      id: 'preview-sample',
      codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      numeroControl: 'DTE-01-00000001-000000000000001',
      tipoDte: '01',
      estado: 'PROCESADO',
      selloRecibido: '2026032712345678901234567890ABCDEF',
      fhProcesamiento: new Date(),
      createdAt: new Date(),
      data: {
        identificacion: {
          version: 1,
          ambiente: '00',
          tipoDte: '01',
          numeroControl: 'DTE-01-00000001-000000000000001',
          codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
          fecEmi: new Date().toISOString().split('T')[0],
          horEmi: '14:30:00',
        },
        receptor: {
          nombre: 'Empresa de Ejemplo, S.A. de C.V.',
          nit: '0614-010101-101-0',
          nrc: '123456-7',
          telefono: '2222-3333',
          correo: 'cliente@ejemplo.com',
          direccion: {
            departamento: '06',
            municipio: '14',
            complemento: 'Col. Escalón, Calle El Mirador #123',
          },
        },
        cuerpoDocumento: [
          {
            numItem: 1,
            cantidad: 5,
            codigo: 'SRV-001',
            descripcion: 'Servicio de consultoría técnica',
            precioUni: 150.0,
            ventaGravada: 750.0,
            ivaItem: 97.5,
          },
          {
            numItem: 2,
            cantidad: 10,
            codigo: 'PROD-002',
            descripcion: 'Licencia de software anual',
            precioUni: 25.0,
            ventaGravada: 250.0,
            ivaItem: 32.5,
          },
          {
            numItem: 3,
            cantidad: 1,
            codigo: 'SRV-003',
            descripcion: 'Capacitación presencial (8 horas)',
            precioUni: 500.0,
            ventaGravada: 500.0,
            ivaItem: 65.0,
          },
        ],
        resumen: {
          totalGravada: 1500.0,
          totalExenta: 0,
          totalNoSuj: 0,
          subTotal: 1500.0,
          ivaRete1: 195.0,
          montoTotalOperacion: 1695.0,
          totalPagar: 1695.0,
          totalLetras:
            'MIL SEISCIENTOS NOVENTA Y CINCO DÓLARES CON 00/100',
          tributos: [{ codigo: '20', descripcion: 'IVA', valor: 195.0 }],
        },
      },
      tenant: {
        nombre: 'Mi Empresa Demo, S.A. de C.V.',
        nit: '0614-123456-789-0',
        nrc: '987654-3',
        direccion: JSON.stringify({
          departamento: '06',
          municipio: '14',
          complemento: 'Blvd. Los Próceres, Edif. Centro #456',
        }),
        telefono: '2555-1234',
        correo: 'info@miempresa.com',
        logoUrl: null,
      },
    };
  }
}
