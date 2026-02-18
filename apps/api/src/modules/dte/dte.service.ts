import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Optional, Inject, forwardRef } from '@nestjs/common';
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { invoiceSentTemplate } from '../email-config/templates';
import { PdfService } from './pdf.service';
import { sendDTE, SendDTERequest, MHReceptionError } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
  FIRMADO: 'FIRMADO',
  ENVIADO: 'ENVIADO',
  PROCESADO: 'PROCESADO',
  RECHAZADO: 'RECHAZADO',
  ANULADO: 'ANULADO',
} as const;

@Injectable()
export class DteService {
  private readonly logger = new Logger(DteService.name);

  constructor(
    private prisma: PrismaService,
    private signerService: SignerService,
    private mhAuthService: MhAuthService,
    private defaultEmailService: DefaultEmailService,
    private pdfService: PdfService,
    @Optional() @Inject(forwardRef(() => WebhooksService)) private webhooksService: WebhooksService | null,
  ) {}

  /**
   * Check if demo mode is enabled for a tenant
   * Demo mode simulates Hacienda responses without actual API calls
   */
  private isDemoMode(tenant?: { plan?: string } | null): boolean {
    // Enable demo mode via environment variable or if tenant plan is DEMO/TRIAL
    if (process.env.DEMO_MODE === 'true') return true;
    if (tenant?.plan === 'DEMO' || tenant?.plan === 'TRIAL') return true;
    return false;
  }

  /**
   * Generate simulated Hacienda response for demo mode
   */
  private generateDemoResponse(codigoGeneracion: string) {
    const selloRecibido = `DEMO${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      estado: 'PROCESADO',
      selloRecibido,
      fhProcesamiento: new Date().toISOString(),
      observaciones: ['[MODO DEMO] Documento procesado en modo de prueba - No enviado a Hacienda'],
    };
  }

  async createDte(tenantId: string | null | undefined, tipoDte: string, data: Record<string, unknown>) {
    this.logger.log(`Creating DTE for tenant ${tenantId}, type ${tipoDte}`);

    // Validate tenantId
    if (!tenantId) {
      throw new BadRequestException('No se puede crear un DTE sin un tenant asignado');
    }

    // Validate required data fields
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Datos del DTE son requeridos');
    }

    const codigoGeneracion = uuidv4().toUpperCase();
    const correlativo = await this.getNextCorrelativo(tenantId, tipoDte);
    const numeroControl = this.generateNumeroControl(tenantId, tipoDte, correlativo);

    const identificacionData = (data.identificacion as Record<string, unknown>) || {};
    const jsonOriginal = {
      ...data,
      identificacion: {
        ...identificacionData,
        codigoGeneracion,
        numeroControl,
      },
    };

    // Extract totals from resumen
    const resumen = data.resumen as Record<string, unknown> | undefined;
    const totalGravada = Number(resumen?.totalGravada) || 0;
    const totalIva = Number(resumen?.totalIva) || 0;
    const totalPagar = Number(resumen?.totalPagar) || 0;

    // Try to find or create client based on receptor data
    let clienteId: string | undefined;
    const receptor = data.receptor as Record<string, unknown> | undefined;
    if (receptor?.nombre) {
      const receptorNombre = receptor.nombre as string;
      const receptorNumDoc = (receptor.numDocumento as string) || '';
      const hasNumDocumento = receptorNumDoc.length > 0;

      this.logger.log(`Client lookup: nombre="${receptorNombre}", numDocumento="${receptorNumDoc}", hasNumDoc=${hasNumDocumento}`);

      // Build search criteria: only match by numDocumento if it's non-empty
      const orConditions: Array<Record<string, string>> = [];
      if (hasNumDocumento) {
        orConditions.push({ numDocumento: receptorNumDoc });
      }
      orConditions.push({ nombre: receptorNombre });

      const existingCliente = await this.prisma.cliente.findFirst({
        where: {
          tenantId,
          OR: orConditions,
        },
      });

      if (existingCliente) {
        this.logger.log(`Found existing client: id=${existingCliente.id}, nombre="${existingCliente.nombre}", numDocumento="${existingCliente.numDocumento}"`);
        clienteId = existingCliente.id;

        // Update client details if they've changed (e.g. email, phone)
        if (existingCliente.nombre !== receptorNombre ||
            existingCliente.correo !== ((receptor.correo as string) || null) ||
            existingCliente.telefono !== ((receptor.telefono as string) || null)) {
          this.logger.log(`Updating existing client ${existingCliente.id} with new details`);
          await this.prisma.cliente.update({
            where: { id: existingCliente.id },
            data: {
              nombre: receptorNombre,
              correo: (receptor.correo as string) || null,
              telefono: (receptor.telefono as string) || null,
            },
          }).catch(err => this.logger.warn(`Failed to update client: ${err instanceof Error ? err.message : err}`));
        }
      } else {
        // Create new client from receptor data
        // When numDocumento is empty, generate a unique placeholder to avoid unique constraint collisions
        const numDocumentoForDb = hasNumDocumento ? receptorNumDoc : `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        try {
          const newCliente = await this.prisma.cliente.create({
            data: {
              tenantId,
              tipoDocumento: (receptor.tipoDocumento as string) || '13',
              numDocumento: numDocumentoForDb,
              nombre: receptorNombre,
              nrc: (receptor.nrc as string) || null,
              telefono: (receptor.telefono as string) || null,
              correo: (receptor.correo as string) || null,
              direccion: JSON.stringify(receptor.direccion || {}),
            },
          });
          this.logger.log(`Created new client: id=${newCliente.id}, nombre="${newCliente.nombre}", numDocumento="${newCliente.numDocumento}"`);
          clienteId = newCliente.id;
        } catch (clientError) {
          // If unique constraint violation on a real numDocumento, find by that document
          if (clientError instanceof Prisma.PrismaClientKnownRequestError && clientError.code === 'P2002') {
            this.logger.warn(`Client unique constraint hit for numDocumento="${receptorNumDoc}", finding by document`);
            if (hasNumDocumento) {
              const retryCliente = await this.prisma.cliente.findFirst({
                where: { tenantId, numDocumento: receptorNumDoc },
              });
              clienteId = retryCliente?.id;
            }
            // If no numDocumento, don't retry - the auto-generated one shouldn't collide
          } else {
            this.logger.error(`Failed to create client during DTE: ${clientError instanceof Error ? clientError.message : clientError}`);
            // Don't fail DTE creation if client creation fails - proceed without clienteId
          }
        }
      }
    }

    this.logger.log(`Creating DTE record: codigoGeneracion=${codigoGeneracion}, numeroControl=${numeroControl}`);
    this.logger.log(`Totals: gravada=${totalGravada}, iva=${totalIva}, pagar=${totalPagar}`);

    try {
      const dte = await this.prisma.dTE.create({
        data: {
          tenantId,
          tipoDte,
          codigoGeneracion,
          numeroControl,
          jsonOriginal: JSON.stringify(jsonOriginal),
          totalGravada: parseFloat(totalGravada.toFixed(2)),
          totalIva: parseFloat(totalIva.toFixed(2)),
          totalPagar: parseFloat(totalPagar.toFixed(2)),
          estado: DTEStatus.PENDIENTE,
          ...(clienteId && { clienteId }),
        },
      });

      this.logger.log(`DTE created successfully: id=${dte.id}`);

      await this.logDteAction(dte.id, 'CREATED', { jsonOriginal });

      // Trigger webhook (fire-and-forget)
      this.triggerWebhook(tenantId, 'dte.created', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        numeroControl: dte.numeroControl,
        tipoDte: dte.tipoDte,
        totalPagar: Number(dte.totalPagar),
        estado: dte.estado,
      }, dte.id);

      return dte;
    } catch (error) {
      this.logger.error(`Failed to create DTE: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async signDte(dteId: string, tenantId?: string) {
    const dte = tenantId
      ? await this.prisma.dTE.findFirst({
          where: { id: dteId, tenantId },
          include: { tenant: true },
        })
      : await this.prisma.dTE.findUnique({
          where: { id: dteId },
          include: { tenant: true },
        });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    // Parse jsonOriginal from string
    let jsonOriginalParsed: Record<string, unknown>;
    try {
      jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch (parseError) {
      this.logger.error(`Failed to parse jsonOriginal for DTE ${dteId}: ${parseError instanceof Error ? parseError.message : parseError}`);
      throw new InternalServerErrorException('Error al procesar datos del DTE: JSON inválido');
    }

    let jsonFirmado: string;

    // Demo mode: simulate signing without a real certificate
    if (this.isDemoMode(dte.tenant)) {
      this.logger.log(`[DEMO MODE] Simulating DTE signing for ${dteId}`);
      // Create a mock JWS-like string for demo purposes
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(jsonOriginalParsed)).toString('base64url');
      const signature = Buffer.from(`DEMO_SIGNATURE_${Date.now()}`).toString('base64url');
      jsonFirmado = `${header}.${payload}.${signature}`;
    } else {
      if (!this.signerService.isCertificateLoaded()) {
        throw new BadRequestException('No hay certificado de firma cargado. Configure su certificado en la sección de ajustes.');
      }
      jsonFirmado = await this.signerService.signDTE(jsonOriginalParsed);
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        jsonFirmado,
        estado: DTEStatus.FIRMADO,
      },
    });

    await this.logDteAction(dteId, 'SIGNED', {
      jsonFirmado: jsonFirmado.substring(0, 100) + '...',
      demoMode: this.isDemoMode(dte.tenant),
    });

    // Trigger webhook (fire-and-forget)
    this.triggerWebhook(dte.tenantId, 'dte.signed', {
      dteId: dte.id,
      codigoGeneracion: dte.codigoGeneracion,
      estado: 'FIRMADO',
    }, dte.id);

    return updated;
  }

  async transmitDte(dteId: string, nit: string, password: string, tenantId?: string) {
    const dte = tenantId
      ? await this.prisma.dTE.findFirst({
          where: { id: dteId, tenantId },
          include: { tenant: true },
        })
      : await this.prisma.dTE.findUnique({
          where: { id: dteId },
          include: { tenant: true },
        });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }
    if (!dte.jsonFirmado) {
      throw new BadRequestException('El DTE no ha sido firmado. Firme el DTE antes de transmitir.');
    }

    // Demo mode: simulate Hacienda response
    if (this.isDemoMode(dte.tenant)) {
      this.logger.log(`[DEMO MODE] Simulating DTE transmission for ${dteId}`);
      const demoResponse = this.generateDemoResponse(dte.codigoGeneracion);

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: demoResponse.selloRecibido,
          fechaRecepcion: new Date(demoResponse.fhProcesamiento),
          descripcionMh: demoResponse.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED_DEMO', { response: demoResponse, demoMode: true });

      // Send email notification (fire-and-forget)
      this.sendDteEmail(updated, dte.tenant).catch((err) =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );

      // Trigger webhook for successful transmission (fire-and-forget)
      this.triggerWebhook(dte.tenantId, 'dte.approved', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: demoResponse.selloRecibido,
        estado: 'PROCESADO',
        fechaAprobacion: demoResponse.fhProcesamiento,
        demoMode: true,
      }, dte.id);

      return updated;
    }

    try {
      // Get auth token
      const env = (process.env.MH_API_ENV as 'test' | 'prod') || 'test';
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

      // Parse jsonOriginal from string
      let jsonOriginalParsed: Record<string, unknown>;
      try {
        jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
          ? JSON.parse(dte.jsonOriginal)
          : dte.jsonOriginal;
      } catch (parseError) {
        this.logger.error(`Failed to parse jsonOriginal for DTE ${dteId}: ${parseError instanceof Error ? parseError.message : parseError}`);
        throw new InternalServerErrorException('Error al procesar datos del DTE: JSON inválido');
      }
      const identificacion = jsonOriginalParsed?.identificacion as Record<string, unknown> | undefined;
      const ambiente = ((identificacion?.ambiente as string) || '00') as '00' | '01';

      const request: SendDTERequest = {
        ambiente,
        idEnvio: Date.now(),
        version: DTE_VERSIONS[dte.tipoDte as TipoDte],
        tipoDte: dte.tipoDte as TipoDte,
        documento: dte.jsonFirmado,
        codigoGeneracion: dte.codigoGeneracion,
      };

      // Send to MH
      const response = await sendDTE(tokenInfo.token, request, { env });

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: response.selloRecibido || undefined,
          fechaRecepcion: response.fhProcesamiento ? new Date(response.fhProcesamiento) : null,
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED', { response });

      // Send email notification (fire-and-forget)
      this.sendDteEmail(updated, dte.tenant).catch((err) =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );

      // Trigger webhook for successful transmission (fire-and-forget)
      this.triggerWebhook(dte.tenantId, 'dte.approved', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: response.selloRecibido,
        estado: 'PROCESADO',
        fechaAprobacion: response.fhProcesamiento,
      }, dte.id);

      return updated;
    } catch (error) {
      // Re-throw NestJS HTTP exceptions as-is (e.g. InternalServerErrorException from JSON parse)
      if (error instanceof InternalServerErrorException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const observaciones = error instanceof MHReceptionError ? error.observaciones : undefined;

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.RECHAZADO,
          descripcionMh: observaciones?.join(', ') || errorMessage,
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMISSION_ERROR', { error: errorMessage, observaciones });

      // Trigger webhook for rejection (fire-and-forget)
      this.triggerWebhook(dte.tenantId, 'dte.rejected', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        estado: 'RECHAZADO',
        error: errorMessage,
        observaciones,
      }, dte.id);

      // Wrap MH errors as BadRequestException with descriptive message
      if (error instanceof MHReceptionError) {
        throw new BadRequestException({
          message: 'DTE rechazado por Hacienda',
          observaciones: error.observaciones,
        });
      }
      throw new InternalServerErrorException(`Error al transmitir DTE: ${errorMessage}`);
    }
  }

  /**
   * Send DTE email with PDF attachment to the receptor.
   * Fire-and-forget: errors are logged but don't affect DTE flow.
   */
  private async sendDteEmail(
    dte: { id: string; tenantId: string; tipoDte: string; codigoGeneracion: string; numeroControl: string; totalPagar: number | { toNumber(): number }; jsonOriginal: string; selloRecepcion?: string | null; estado: string; createdAt: Date },
    tenant?: { id?: string; nombre: string; nit: string; nrc: string; direccion?: string | null; telefono: string; correo: string } | null,
  ): Promise<void> {
    // Parse receptor email from jsonOriginal
    let parsedData: Record<string, unknown>;
    try {
      parsedData = typeof dte.jsonOriginal === 'string' ? JSON.parse(dte.jsonOriginal) : dte.jsonOriginal;
    } catch {
      this.logger.warn(`Cannot parse jsonOriginal for email, DTE ${dte.id}`);
      return;
    }

    const receptor = parsedData.receptor as Record<string, unknown> | undefined;
    const correoReceptor = receptor?.correo as string | undefined;

    if (!correoReceptor) {
      this.logger.debug(`No receptor email for DTE ${dte.id}, skipping email`);
      return;
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateInvoicePdf({
      id: dte.id,
      codigoGeneracion: dte.codigoGeneracion,
      numeroControl: dte.numeroControl,
      tipoDte: dte.tipoDte,
      estado: dte.estado,
      data: parsedData,
      createdAt: dte.createdAt,
      tenant: tenant ? {
        nombre: tenant.nombre,
        nit: tenant.nit,
        nrc: tenant.nrc,
        direccion: tenant.direccion ?? undefined,
        telefono: tenant.telefono,
        correo: tenant.correo,
      } : undefined,
    });

    const tipoLabel = dte.tipoDte === '01' ? 'Factura' : dte.tipoDte === '03' ? 'Comprobante de Crédito Fiscal' : dte.tipoDte === '11' ? 'Factura de Exportación' : 'Documento Tributario';
    const filename = `${tipoLabel}-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
    const nombreReceptor = (receptor?.nombre as string) || 'Cliente';
    const nombreEmisor = tenant?.nombre || 'Facturador Electrónico SV';

    const { html, text } = invoiceSentTemplate({
      tipoLabel,
      numeroControl: dte.numeroControl,
      codigoGeneracion: dte.codigoGeneracion,
      totalPagar: `$${Number(dte.totalPagar).toFixed(2)}`,
      selloRecepcion: dte.selloRecepcion,
      nombreReceptor,
      nombreEmisor,
    });

    const result = await this.defaultEmailService.sendEmailWithAttachment(dte.tenantId, {
      to: correoReceptor,
      subject: `${tipoLabel} ${dte.numeroControl} - ${nombreEmisor}`,
      html,
      text,
      attachments: [{
        filename,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      }],
    });

    if (result.success) {
      this.logger.log(`DTE email sent to ${correoReceptor} for DTE ${dte.numeroControl}`);
    } else {
      this.logger.warn(`DTE email failed for ${dte.numeroControl}: ${result.errorMessage}`);
    }
  }

  async findByTenant(
    tenantId: string | null | undefined,
    page = 1,
    limit = 20,
    filters?: { tipoDte?: string; estado?: string; search?: string },
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`Finding DTEs for tenant ${tenantId}, page ${page}, limit ${limit}`);
    this.logger.log(`Filters: ${JSON.stringify(filters)}, sort: ${sortBy || 'createdAt'} ${sortOrder || 'desc'}`);

    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned, returning empty results');
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      totalPagar: 'totalPagar',
      numeroControl: 'numeroControl',
      tipoDte: 'tipoDte',
      estado: 'estado',
    };

    const resolvedSortBy = sortBy && allowedSortFields[sortBy] ? allowedSortFields[sortBy] : 'createdAt';
    const resolvedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { tenantId };

    if (filters?.tipoDte) {
      where.tipoDte = filters.tipoDte;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.search) {
      where.OR = [
        { numeroControl: { contains: filters.search } },
        { codigoGeneracion: { contains: filters.search } },
        { cliente: { nombre: { contains: filters.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dTE.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [resolvedSortBy]: resolvedSortOrder },
        include: { cliente: true },
      }),
      this.prisma.dTE.count({ where }),
    ]);

    this.logger.log(`Found ${total} DTEs for tenant ${tenantId}, returning ${data.length} results`);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId?: string) {
    if (tenantId) {
      return this.prisma.dTE.findFirst({
        where: { id, tenantId },
        include: { cliente: true, logs: true },
      });
    }
    return this.prisma.dTE.findUnique({
      where: { id },
      include: { cliente: true, logs: true },
    });
  }

  /**
   * Manually trigger email sending for a DTE (for testing or resending).
   * Works regardless of DTE status — no Hacienda approval required.
   */
  async sendEmailManually(
    id: string,
    tenantId: string,
    overrideEmail?: string,
  ): Promise<{ success: boolean; message: string }> {
    const dte = await this.prisma.dTE.findFirst({
      where: { id, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    // Parse receptor email
    let parsedData: Record<string, unknown>;
    try {
      parsedData = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch {
      throw new BadRequestException('No se pudo parsear jsonOriginal del DTE');
    }

    const receptor = parsedData.receptor as Record<string, unknown> | undefined;
    const correoReceptor = overrideEmail || (receptor?.correo as string | undefined);

    if (!correoReceptor) {
      throw new BadRequestException(
        'El DTE no tiene correo de receptor. Proporcione un correo en el body: { "email": "correo@ejemplo.com" }',
      );
    }

    // If override email provided, patch it into the parsed data for the template
    if (overrideEmail && receptor) {
      receptor.correo = overrideEmail;
      parsedData.receptor = receptor;
    }

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateInvoicePdf({
      id: dte.id,
      codigoGeneracion: dte.codigoGeneracion,
      numeroControl: dte.numeroControl,
      tipoDte: dte.tipoDte,
      estado: dte.estado,
      data: parsedData,
      createdAt: dte.createdAt,
      tenant: dte.tenant ? {
        nombre: dte.tenant.nombre,
        nit: dte.tenant.nit,
        nrc: dte.tenant.nrc,
        direccion: dte.tenant.direccion ?? undefined,
        telefono: dte.tenant.telefono,
        correo: dte.tenant.correo,
      } : undefined,
    });

    const tipoLabel = dte.tipoDte === '01' ? 'Factura' : dte.tipoDte === '03' ? 'Comprobante de Crédito Fiscal' : dte.tipoDte === '11' ? 'Factura de Exportación' : 'Documento Tributario';
    const filename = `${tipoLabel}-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
    const nombreReceptor = (receptor?.nombre as string) || 'Cliente';
    const nombreEmisor = dte.tenant?.nombre || 'Facturador Electrónico SV';

    const { html, text } = invoiceSentTemplate({
      tipoLabel,
      numeroControl: dte.numeroControl,
      codigoGeneracion: dte.codigoGeneracion,
      totalPagar: `$${Number(dte.totalPagar).toFixed(2)}`,
      selloRecepcion: dte.selloRecepcion,
      nombreReceptor,
      nombreEmisor,
    });

    const result = await this.defaultEmailService.sendEmailWithAttachment(dte.tenantId, {
      to: correoReceptor,
      subject: `${tipoLabel} ${dte.numeroControl} - ${nombreEmisor}`,
      html,
      text,
      attachments: [{
        filename,
        content: pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      }],
    });

    if (result.success) {
      this.logger.log(`Manual DTE email sent to ${correoReceptor} for DTE ${dte.numeroControl}`);
      return { success: true, message: `Email enviado a ${correoReceptor}` };
    } else {
      this.logger.warn(`Manual DTE email failed for ${dte.numeroControl}: ${result.errorMessage}`);
      return { success: false, message: `Error al enviar email: ${result.errorMessage}` };
    }
  }

  async findOneWithTenant(id: string, tenantId?: string) {
    if (tenantId) {
      return this.prisma.dTE.findFirst({
        where: { id, tenantId },
        include: { cliente: true, logs: true, tenant: true },
      });
    }
    return this.prisma.dTE.findUnique({
      where: { id },
      include: { cliente: true, logs: true, tenant: true },
    });
  }

  async anularDte(dteId: string, motivo: string, tenantId?: string) {
    const dte = tenantId
      ? await this.prisma.dTE.findFirst({
          where: { id: dteId, tenantId },
        })
      : await this.prisma.dTE.findUnique({
          where: { id: dteId },
        });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    if (dte.estado === DTEStatus.ANULADO) {
      throw new BadRequestException('El DTE ya está anulado');
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        estado: DTEStatus.ANULADO,
        descripcionMh: `Anulado: ${motivo}`,
      },
    });

    await this.logDteAction(dteId, 'ANULADO', { motivo });

    return updated;
  }

  private async getNextCorrelativo(tenantId: string, tipoDte: string): Promise<number> {
    const lastDte = await this.prisma.dTE.findFirst({
      where: { tenantId, tipoDte },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastDte) return 1;

    const match = lastDte.numeroControl.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) + 1 : 1;
  }

  private generateNumeroControl(tenantId: string, tipoDte: string, correlativo: number): string {
    const establecimiento = `M${String(Math.abs(tenantId.hashCode() % 999) + 1).padStart(3, '0')}P001`; // TODO: Get from tenant config
    return `DTE-${tipoDte}-${establecimiento}-${correlativo.toString().padStart(15, '0')}`;
  }

  private async logDteAction(dteId: string, accion: string, data: Record<string, unknown>) {
    try {
      await this.prisma.dTELog.create({
        data: {
          dteId,
          accion,
          request: JSON.stringify(data),
        },
      });
    } catch (logError) {
      // Logging failures should never crash the main DTE operation
      this.logger.error(`Failed to log DTE action [${accion}] for ${dteId}: ${logError instanceof Error ? logError.message : logError}`);
    }
  }

  /**
   * Fire-and-forget webhook trigger. Errors are logged but never thrown.
   */
  private triggerWebhook(
    tenantId: string,
    eventType: string,
    data: Record<string, unknown>,
    correlationId: string,
  ): void {
    if (!this.webhooksService) return;
    this.webhooksService.triggerEvent({ tenantId, eventType, data, correlationId }).catch((err) =>
      this.logger.error(`Webhook trigger failed for ${eventType}: ${err instanceof Error ? err.message : err}`),
    );
  }

  // =====================
  // Analytics Methods
  // =====================

  async getSummaryStats(tenantId: string | null | undefined) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getSummaryStats');
      return {
        dtesHoy: 0,
        dtesMes: 0,
        dtesMesAnterior: 0,
        dtesMesChange: 0,
        totalFacturado: 0,
        totalFacturadoChange: 0,
        rechazados: 0,
      };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      dtesToday,
      dtesThisMonth,
      dtesLastMonth,
      totalThisMonth,
      totalLastMonth,
      rejectedCount,
    ] = await Promise.all([
      // DTEs today
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      // DTEs this month
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      // DTEs last month
      this.prisma.dTE.count({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      // Total facturado this month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      // Total facturado last month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      // Rejected DTEs
      this.prisma.dTE.count({
        where: { tenantId, estado: DTEStatus.RECHAZADO },
      }),
    ]);

    const totalFacturadoMes = Number(totalThisMonth._sum?.totalPagar) || 0;
    const totalFacturadoMesAnterior = Number(totalLastMonth._sum?.totalPagar) || 0;

    // Calculate percentage changes
    const dtesMesChange = dtesLastMonth > 0
      ? Math.round(((dtesThisMonth - dtesLastMonth) / dtesLastMonth) * 100)
      : dtesThisMonth > 0 ? 100 : 0;

    const facturadoChange = totalFacturadoMesAnterior > 0
      ? Math.round(((totalFacturadoMes - totalFacturadoMesAnterior) / totalFacturadoMesAnterior) * 100)
      : totalFacturadoMes > 0 ? 100 : 0;

    return {
      dtesHoy: dtesToday,
      dtesMes: dtesThisMonth,
      dtesMesAnterior: dtesLastMonth,
      dtesMesChange,
      totalFacturado: totalFacturadoMes,
      totalFacturadoChange: facturadoChange,
      rechazados: rejectedCount,
    };
  }

  async getStatsByDate(
    tenantId: string | null | undefined,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByDate');
      return [];
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days default

    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        totalPagar: true,
        tipoDte: true,
        estado: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { count: number; total: number; date: string }> = {};

    dtes.forEach((dte: typeof dtes[0]) => {
      const date = dte.createdAt;
      let key: string;

      switch (groupBy) {
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, total: 0, date: key };
      }
      grouped[key].count += 1;
      grouped[key].total += Number(dte.totalPagar) || 0;
    });

    // Fill in missing dates for continuous chart
    const result: Array<{ fecha: string; cantidad: number; total: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      let key: string;

      switch (groupBy) {
        case 'month':
          key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          current.setMonth(current.getMonth() + 1);
          break;
        case 'week':
          const weekStart = new Date(current);
          weekStart.setDate(current.getDate() - current.getDay());
          key = weekStart.toISOString().split('T')[0];
          current.setDate(current.getDate() + 7);
          break;
        default:
          key = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 1);
      }

      const data = grouped[key];
      result.push({
        fecha: key,
        cantidad: data?.count || 0,
        total: data?.total || 0,
      });
    }

    return result;
  }

  async getStatsByType(tenantId: string | null | undefined, startDate?: Date, endDate?: Date) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByType');
      return [];
    }

    const where: Record<string, unknown> = { tenantId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.createdAt = dateFilter;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
    });

    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'Credito Fiscal',
      '05': 'Nota de Credito',
      '06': 'Nota de Debito',
      '07': 'Nota de Remision',
      '11': 'Factura Exportacion',
      '14': 'Factura Sujeto Excluido',
    };

    return stats.map((s: typeof stats[0]) => ({
      tipoDte: s.tipoDte,
      nombre: tipoDteNames[s.tipoDte] || s.tipoDte,
      cantidad: s._count.id,
      total: Number(s._sum.totalPagar) || 0,
    }));
  }

  async getStatsByStatus(tenantId: string | null | undefined) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByStatus');
      return [];
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['estado'],
      where: { tenantId },
      _count: { id: true },
    });

    return stats.map((s: typeof stats[0]) => ({
      estado: s.estado,
      cantidad: s._count.id,
    }));
  }

  async getTopClients(
    tenantId: string | null | undefined,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getTopClients');
      return [];
    }

    const where: Record<string, unknown> = {
      tenantId,
      clienteId: { not: null },
      estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.createdAt = dateFilter;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['clienteId'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
      orderBy: { _sum: { totalPagar: 'desc' } },
      take: limit,
    });

    // Get client names
    const clientIds = stats.map((s: typeof stats[0]) => s.clienteId).filter(Boolean) as string[];
    const clients = await this.prisma.cliente.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, nombre: true, numDocumento: true },
    });

    const clientMap = new Map(clients.map((c: typeof clients[0]) => [c.id, c]));

    return stats.map((s: typeof stats[0]) => {
      const client = clientMap.get(s.clienteId!) as typeof clients[0] | undefined;
      return {
        clienteId: s.clienteId,
        nombre: client?.nombre || 'Sin nombre',
        numDocumento: client?.numDocumento || '',
        cantidadDtes: s._count.id,
        totalFacturado: Number(s._sum.totalPagar) || 0,
      };
    });
  }

  async getRecentDTEs(tenantId: string | null | undefined, limit = 5) {
    // Handle case where user has no tenant assigned
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getRecentDTEs');
      return [];
    }

    return this.prisma.dTE.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { cliente: { select: { nombre: true, numDocumento: true } } },
    });
  }
}
