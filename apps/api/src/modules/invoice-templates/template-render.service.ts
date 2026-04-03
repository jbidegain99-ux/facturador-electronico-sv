import {
  Injectable,
  Logger,
  OnModuleDestroy,
  NotFoundException,
} from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import type { Browser } from 'playwright';
import { PrismaService } from '../../prisma/prisma.service';
import { registerHelpers } from './helpers/register-helpers';
import { DEPARTAMENTOS } from '@facturador/shared';
import type { DteData } from '../dte/pdf.service';
import type { TemplateConfig, PageSettings } from './interfaces/template-config.interface';
import { DEFAULT_TEMPLATE_CONFIG } from './interfaces/template-config.interface';

interface TemplateContext {
  tipoDte: string;
  codigoGeneracion: string;
  numeroControl: string;
  estado: string;
  selloRecibido: string | null;
  fhProcesamiento: string | null;
  identificacion: Record<string, unknown>;
  emisor: {
    nombre: string;
    nit: string;
    nrc: string;
    direccionFormateada: string;
    telefono: string;
    correo: string;
  };
  receptor: Record<string, unknown> & { direccionFormateada?: string };
  cuerpoDocumento: Record<string, unknown>[];
  resumen: Record<string, unknown>;
  totalIva: number;
  logoDataUrl: string | null;
  qrDataUrl: string | null;
  config: TemplateConfig;
  isDemoMode: boolean;
}

@Injectable()
export class TemplateRenderService implements OnModuleDestroy {
  private readonly logger = new Logger(TemplateRenderService.name);
  private browser: Browser | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      this.logger.log('Playwright browser launched');
    }
    return this.browser;
  }

  /**
   * Compile a Handlebars template with DTE data into an HTML string.
   */
  async compileHtml(
    templateId: string,
    dteData: DteData,
    tenantId: string,
  ): Promise<{ html: string; config: TemplateConfig }> {
    // Resolve the template
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id: templateId, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const config: TemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      ...JSON.parse(template.config),
    };

    // Build context
    const context = await this.buildContext(dteData, config);

    // Create isolated Handlebars instance and register helpers
    const hbs = Handlebars.create();
    registerHelpers(hbs);

    // Compile template
    const compiledTemplate = hbs.compile(template.htmlTemplate);
    const html = compiledTemplate(context);

    return { html, config };
  }

  /**
   * Compile HTML using a resolved template (for preview with system templates).
   */
  async compileHtmlFromTemplate(
    htmlTemplate: string,
    config: TemplateConfig,
    dteData: DteData,
  ): Promise<string> {
    const context = await this.buildContext(dteData, config);
    const hbs = Handlebars.create();
    registerHelpers(hbs);
    const compiledTemplate = hbs.compile(htmlTemplate);
    return compiledTemplate(context);
  }

  /**
   * Generate PDF from HTML string using Playwright.
   */
  async generatePdf(
    html: string,
    pageSettings?: Partial<PageSettings>,
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      // Wait for fonts to load
      await page.waitForTimeout(500);

      const settings = { ...DEFAULT_TEMPLATE_CONFIG.pageSettings, ...pageSettings };
      const format = settings.size === 'a4' ? 'A4' : 'Letter';

      const pdfBuffer = await page.pdf({
        format,
        printBackground: true,
        margin: {
          top: `${settings.margins.top}mm`,
          right: `${settings.margins.right}mm`,
          bottom: `${settings.margins.bottom}mm`,
          left: `${settings.margins.left}mm`,
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Resolve the effective template for a tenant + optional DTE type.
   * Returns null if the tenant has no custom template (triggers legacy PDF fallback).
   * Priority: tenant+dteType default → tenant general default → null
   */
  async resolveTemplate(
    tenantId: string,
    dteType?: string,
  ): Promise<{ id: string; htmlTemplate: string; config: TemplateConfig } | null> {
    // 1. Tenant-specific template for this DTE type
    if (dteType) {
      const tenantDteTemplate = await this.prisma.invoiceTemplate.findFirst({
        where: { tenantId, dteType, isDefault: true, isActive: true },
      });
      if (tenantDteTemplate) {
        return {
          id: tenantDteTemplate.id,
          htmlTemplate: tenantDteTemplate.htmlTemplate,
          config: this.mergeConfig(tenantDteTemplate.config),
        };
      }
    }

    // 2. Tenant general default
    const tenantDefault = await this.prisma.invoiceTemplate.findFirst({
      where: { tenantId, dteType: null, isDefault: true, isActive: true },
    });
    if (tenantDefault) {
      return {
        id: tenantDefault.id,
        htmlTemplate: tenantDefault.htmlTemplate,
        config: this.mergeConfig(tenantDefault.config),
      };
    }

    // 3. No tenant template found — return null to trigger legacy PDF fallback
    return null;
  }

  /**
   * Resolve template for previews — always returns a template (uses system fallback).
   */
  async resolveTemplateForPreview(
    tenantId: string,
    dteType?: string,
  ): Promise<{ id: string; htmlTemplate: string; config: TemplateConfig }> {
    // Try tenant template first
    const tenantTemplate = await this.resolveTemplate(tenantId, dteType);
    if (tenantTemplate) return tenantTemplate;

    // System template fallback (for previews)
    const systemDefault = await this.prisma.invoiceTemplate.findFirst({
      where: { isSystem: true, slug: 'clasica', isActive: true },
    });
    if (systemDefault) {
      return {
        id: systemDefault.id,
        htmlTemplate: systemDefault.htmlTemplate,
        config: this.mergeConfig(systemDefault.config),
      };
    }

    // File fallback
    const fallbackHtml = fs.readFileSync(
      path.join(__dirname, 'templates', 'clasica.hbs'),
      'utf-8',
    );
    return {
      id: 'fallback',
      htmlTemplate: fallbackHtml,
      config: DEFAULT_TEMPLATE_CONFIG,
    };
  }

  private mergeConfig(configJson: string): TemplateConfig {
    try {
      const parsed = JSON.parse(configJson) as Record<string, unknown>;
      return this.deepMerge(
        DEFAULT_TEMPLATE_CONFIG as unknown as Record<string, unknown>,
        parsed,
      ) as unknown as TemplateConfig;
    } catch {
      return DEFAULT_TEMPLATE_CONFIG;
    }
  }

  /**
   * Build the full template context from DTE data.
   */
  private async buildContext(
    dteData: DteData,
    config: TemplateConfig,
  ): Promise<TemplateContext> {
    const data = dteData.data as {
      identificacion?: Record<string, unknown>;
      receptor?: Record<string, unknown>;
      cuerpoDocumento?: Record<string, unknown>[];
      resumen?: Record<string, unknown>;
    };

    const receptor = (data?.receptor || {}) as Record<string, unknown>;
    const resumen = (data?.resumen || {}) as Record<string, unknown>;

    // Generate QR and fetch logo in parallel
    const [qrDataUrl, logoDataUrl] = await Promise.all([
      this.generateQrDataUrl(dteData),
      dteData.tenant?.logoUrl
        ? this.fetchImageAsDataUrl(dteData.tenant.logoUrl)
        : Promise.resolve(null),
    ]);

    // Format addresses
    const receptorDireccion = receptor.direccion as
      | { departamento?: string; municipio?: string; complemento?: string }
      | undefined;

    return {
      tipoDte: dteData.tipoDte,
      codigoGeneracion: dteData.codigoGeneracion,
      numeroControl: dteData.numeroControl,
      estado: dteData.estado,
      selloRecibido: dteData.selloRecibido || null,
      fhProcesamiento: dteData.fhProcesamiento
        ? new Date(dteData.fhProcesamiento).toLocaleString('es-SV')
        : null,
      identificacion: data?.identificacion || {},
      emisor: {
        nombre: dteData.tenant?.nombre || '',
        nit: dteData.tenant?.nit || '',
        nrc: dteData.tenant?.nrc || '',
        direccionFormateada: this.parseTenantDireccion(
          dteData.tenant?.direccion,
        ),
        telefono: dteData.tenant?.telefono || '',
        correo: dteData.tenant?.correo || '',
      },
      receptor: {
        ...receptor,
        direccionFormateada: this.formatDireccion(receptorDireccion),
      },
      cuerpoDocumento: data?.cuerpoDocumento || [],
      resumen,
      totalIva: this.getIvaAmount(dteData, resumen),
      logoDataUrl,
      qrDataUrl,
      config,
      isDemoMode: this.isDemoMode(dteData),
    };
  }

  private async generateQrDataUrl(dte: DteData): Promise<string | null> {
    try {
      const identificacion = (
        dte.data as { identificacion?: { ambiente?: string; fecEmi?: string } }
      )?.identificacion;
      const ambiente = identificacion?.ambiente || '00';
      const fecEmi =
        identificacion?.fecEmi ||
        dte.createdAt.toISOString().split('T')[0];

      const url = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${dte.codigoGeneracion}&fechaEmi=${fecEmi}`;

      return await QRCode.toDataURL(url, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      this.logger.error(`Error generating QR code: ${error}`);
      return null;
    }
  }

  private async fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.warn(`Failed to fetch logo from ${url}: ${error}`);
      return null;
    }
  }

  private formatDireccion(direccion?: {
    departamento?: string;
    municipio?: string;
    complemento?: string;
  }): string {
    if (!direccion) return '';
    const parts: string[] = [];
    if (direccion.complemento) parts.push(direccion.complemento);
    if (direccion.municipio) parts.push(direccion.municipio);
    const deptoName = direccion.departamento
      ? DEPARTAMENTOS[direccion.departamento] || direccion.departamento
      : '';
    if (deptoName) parts.push(deptoName);
    return parts.join(', ') || '';
  }

  private parseTenantDireccion(direccion?: string): string {
    if (!direccion) return '';
    try {
      const parsed = JSON.parse(direccion);
      if (typeof parsed === 'object' && parsed !== null) {
        return this.formatDireccion(
          parsed as {
            departamento?: string;
            municipio?: string;
            complemento?: string;
          },
        );
      }
      return direccion;
    } catch {
      return direccion;
    }
  }

  private isDemoMode(dte: DteData): boolean {
    if (dte.selloRecibido?.startsWith('DEMO')) return true;
    if (dte.tenant?.nit === 'DEMO') return true;
    return false;
  }

  private getIvaAmount(
    dte: DteData,
    resumen: Record<string, unknown>,
  ): number {
    // Direct totalIva field
    if (typeof resumen.totalIva === 'number') return resumen.totalIva;

    // Tributos array
    const tributos = (resumen.tributos as Array<{ codigo: string; valor: number }>) || [];
    const ivaTributo = tributos.find((t) => t.codigo === '20');
    if (ivaTributo) return ivaTributo.valor;

    // ivaRete1 fallback
    if (typeof resumen.ivaRete1 === 'number') return resumen.ivaRete1;

    // Sum per-item IVA
    const items = (
      dte.data as { cuerpoDocumento?: Array<{ ivaItem?: number }> }
    )?.cuerpoDocumento;
    if (items?.length) {
      const sum = items.reduce((acc, item) => acc + (item.ivaItem || 0), 0);
      if (sum > 0) return sum;
    }

    // Calculate from totalGravada
    const totalGravada = Number(resumen.totalGravada) || 0;
    if (totalGravada > 0) {
      return Math.round(totalGravada * 0.13 * 100) / 100;
    }

    return 0;
  }

  deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = this.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>,
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
