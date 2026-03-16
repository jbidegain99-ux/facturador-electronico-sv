import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Optional, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
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
import { AccountingAutomationService } from '../accounting/accounting-automation.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { invoiceSentTemplate } from '../email-config/templates';
import { PdfService } from './pdf.service';
import { sendDTE, SendDTERequest, MHReceptionError } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { HaciendaAuthService } from '../hacienda/services/hacienda-auth.service';
import { CertificateService } from '../hacienda/services/certificate.service';
import { EncryptionService } from '../email-config/services/encryption.service';

/** Convert a number to its Spanish text representation for totalLetras */
function numberToWords(num: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (n === 20) return 'VEINTE';
      if (n < 30) return 'VEINTI' + units[unit];
      return tens[ten] + (unit ? ' Y ' + units[unit] : '');
    }
    if (n === 100) return 'CIEN';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return hundreds[hundred] + (rest ? ' ' + convertGroup(rest) : '');
  };
  const convertThousands = (n: number): string => {
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      const rest = n % 1000;
      return (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + (rest ? ' ' + convertGroup(rest) : '');
    }
    return convertGroup(n);
  };
  let result = '';
  if (intPart === 0) result = 'CERO';
  else if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    const rest = intPart % 1000000;
    result = (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') + (rest ? ' ' + convertThousands(rest) : '');
  } else result = convertThousands(intPart);
  return `${result} ${decPart.toString().padStart(2, '0')}/100 USD`;
}

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
  FIRMADO: 'FIRMADO',
  ENVIADO: 'ENVIADO',
  PROCESADO: 'PROCESADO',
  RECHAZADO: 'RECHAZADO',
  ANULADO: 'ANULADO',
} as const;

/** Common activity codes from MH catalog (CAT-019) */
const ACTIVIDAD_ECONOMICA_MAP: Record<string, string> = {
  '62010': 'Actividades de programación informática',
  '62020': 'Actividades de consultoría informática y gestión de instalaciones informáticas',
  '62090': 'Otras actividades de tecnología de la información y servicios informáticos',
  '46510': 'Venta al por mayor de computadoras, equipo periférico y programas informáticos',
  '47410': 'Venta al por menor de computadoras, equipo periférico, programas informáticos y equipo de telecomunicaciones en comercios especializados',
  '63110': 'Procesamiento de datos, hospedaje y actividades conexas',
  '70210': 'Actividades de consultoría de gestión',
  '73110': 'Publicidad',
  '69200': 'Actividades de contabilidad, teneduría de libros y auditoría; consultoría fiscal',
  '56101': 'Actividades de restaurantes y de servicio móvil de comidas',
  '47190': 'Otras actividades de venta al por menor en comercios no especializados',
  '41001': 'Construcción de edificios residenciales',
  '41002': 'Construcción de edificios no residenciales',
  '49110': 'Transporte interurbano de pasajeros por ferrocarril',
};

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
    @Optional() @Inject(forwardRef(() => AccountingAutomationService)) private accountingAutomation: AccountingAutomationService | null,
    @Optional() private sucursalesService: SucursalesService | null,
    private haciendaAuthService: HaciendaAuthService,
    private certificateService: CertificateService,
    private encryptionService: EncryptionService,
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
    const numeroControl = await this.generateNumeroControl(tenantId, tipoDte, correlativo);

    // Resolve ambiente from tenant's HaciendaConfig (PRODUCTION → '01', TEST → '00')
    const ambiente = await this.resolveAmbiente(tenantId);

    const identificacionData = (data.identificacion as Record<string, unknown>) || {};

    // Normalize the DTE JSON to comply with Hacienda schema for the specific tipoDte
    let normalizedData: Record<string, unknown>;
    try {
      normalizedData = await this.normalizeJsonForHacienda(tenantId, tipoDte, data);
    } catch (normalizeError) {
      this.logger.error(`Failed to normalize DTE JSON for tenant ${tenantId}, type ${tipoDte}: ${normalizeError instanceof Error ? normalizeError.message : normalizeError}`);
      if (normalizeError instanceof BadRequestException) throw normalizeError;
      throw new BadRequestException(
        `Error al preparar datos del DTE: ${normalizeError instanceof Error ? normalizeError.message : 'Error desconocido'}`,
      );
    }

    const jsonOriginal = {
      ...normalizedData,
      identificacion: {
        ...((normalizedData.identificacion as Record<string, unknown>) || identificacionData),
        codigoGeneracion,
        numeroControl,
        ambiente,
      },
    };

    // Extract totals from resumen (structure varies by DTE type)
    const resumen = normalizedData.resumen as Record<string, unknown> | undefined;
    let totalGravada: number;
    let totalIva: number;
    let totalPagar: number;

    if (tipoDte === '07') {
      // Comprobante de Retención: uses totalSujetoRetencion/totalIVAretenido
      totalGravada = Number(resumen?.totalSujetoRetencion) || 0;
      totalIva = Number(resumen?.totalIVAretenido) || 0;
      totalPagar = totalIva; // Retention amount is what's "paid"
    } else if (tipoDte === '34') {
      // CRS: uses totalSujetoRetencion/totalRetenido
      totalGravada = Number(resumen?.totalSujetoRetencion) || 0;
      totalIva = 0;
      totalPagar = Number(resumen?.totalRetenido) || 0;
    } else if (tipoDte === '09') {
      // Documento Contable de Liquidación: uses liquidoApagar as totalPagar
      totalGravada = Number(resumen?.totalGravada) || 0;
      totalIva = Number(resumen?.totalIva) || 0;
      totalPagar = Number(resumen?.liquidoApagar) || Number(resumen?.totalPagar) || 0;
    } else if (tipoDte === '11') {
      // Factura de Exportación: 0% IVA
      totalGravada = Number(resumen?.totalGravada) || 0;
      totalIva = 0;
      totalPagar = Number(resumen?.totalPagar) || Number(resumen?.montoTotalOperacion) || 0;
    } else if (tipoDte === '14') {
      // Sujeto Excluido: no IVA, uses totalCompra
      totalGravada = Number(resumen?.totalCompra) || 0;
      totalIva = 0;
      totalPagar = Number(resumen?.totalPagar) || totalGravada;
    } else {
      totalGravada = Number(resumen?.totalGravada) || 0;
      // For CCF (03), NC (05), ND (06): IVA is in tributos array, not in totalIva field
      const tributos = resumen?.tributos as Array<Record<string, unknown>> | null | undefined;
      const tributosIva = tributos?.[0]?.valor ? Number(tributos[0].valor) : 0;
      totalIva = Number(resumen?.totalIva) || tributosIva || 0;
      totalPagar = Number(resumen?.totalPagar) || 0;
    }

    // Try to find or create client based on receptor data
    // Type 14 uses sujetoExcluido, type 07 uses receptor
    let clienteId: string | undefined;
    const receptor = (tipoDte === '14'
      ? data.sujetoExcluido as Record<string, unknown> | undefined
      : data.receptor as Record<string, unknown> | undefined);
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
          // existingCliente was found via tenant-scoped query, safe to update by id
          await this.prisma.cliente.updateMany({
            where: { id: existingCliente.id, tenantId },
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

      // Trigger accounting entry on creation (fire-and-forget)
      this.triggerAccountingEntry(dte.id, tenantId, 'ON_CREATED');

      // Auto sign and transmit to Hacienda (fire-and-forget)
      this.autoSignAndTransmit(dte.id, tenantId).catch(err =>
        this.logger.error(`Auto sign+transmit failed for DTE ${dte.id}: ${err instanceof Error ? err.message : err}`),
      );

      return dte;
    } catch (error) {
      this.logger.error(`Failed to create DTE: ${error instanceof Error ? error.message : error}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(
          `Número de control duplicado (${numeroControl}). Intente de nuevo.`,
        );
      }
      throw error;
    }
  }

  /**
   * Automatically sign and transmit a DTE after creation.
   * Loads the tenant's certificate from HaciendaEnvironmentConfig and signs per-tenant.
   */
  private async autoSignAndTransmit(dteId: string, tenantId: string): Promise<void> {
    this.logger.log(`[AUTO] Starting auto sign+transmit for DTE ${dteId}`);

    // Load DTE with tenant info
    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new Error(`DTE ${dteId} not found for tenant ${tenantId}`);
    }

    // Parse jsonOriginal
    let jsonOriginalParsed: Record<string, unknown>;
    try {
      jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch {
      throw new Error(`Failed to parse jsonOriginal for DTE ${dteId}`);
    }

    // Resolve ambiente
    const tenantAmbiente = await this.resolveAmbiente(tenantId);
    const haciendaEnv: 'TEST' | 'PRODUCTION' = tenantAmbiente === '01' ? 'PRODUCTION' : 'TEST';
    const mhEnv: 'test' | 'prod' = tenantAmbiente === '01' ? 'prod' : 'test';

    // Demo mode: simulate signing + transmission
    if (this.isDemoMode(dte.tenant)) {
      this.logger.log(`[AUTO][DEMO] Simulating sign+transmit for DTE ${dteId}`);
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(jsonOriginalParsed)).toString('base64url');
      const signature = Buffer.from(`DEMO_SIGNATURE_${Date.now()}`).toString('base64url');
      const jsonFirmado = `${header}.${payload}.${signature}`;
      const demoResponse = this.generateDemoResponse(dte.codigoGeneracion);

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          jsonFirmado,
          estado: DTEStatus.PROCESADO,
          selloRecepcion: demoResponse.selloRecibido,
          fechaRecepcion: new Date(demoResponse.fhProcesamiento),
          descripcionMh: demoResponse.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'AUTO_SIGN_TRANSMIT_DEMO', { demoMode: true });
      this.sendDteEmail(dte, dte.tenant).catch(err =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );
      this.triggerWebhook(tenantId, 'dte.approved', {
        dteId: dte.id, codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: demoResponse.selloRecibido, estado: 'PROCESADO', demoMode: true,
      }, dte.id);
      this.triggerAccountingEntry(dte.id, tenantId, 'ON_APPROVED');
      return;
    }

    // Step 1: Load tenant's certificate from HaciendaEnvironmentConfig
    const envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfig: { tenantId },
        environment: haciendaEnv,
      },
    });

    if (!envConfig?.certificateP12) {
      throw new Error(`No certificate found for tenant ${tenantId} in environment ${haciendaEnv}`);
    }

    const certPassword = envConfig.certificatePasswordEnc
      ? this.encryptionService.decrypt(envConfig.certificatePasswordEnc)
      : undefined;

    // Step 2: Sign the DTE using tenant's certificate
    const certBuffer = Buffer.from(envConfig.certificateP12);
    const jsonFirmado = await this.certificateService.signPayload(certBuffer, certPassword, jsonOriginalParsed);

    await this.prisma.dTE.update({
      where: { id: dteId },
      data: { jsonFirmado, estado: DTEStatus.FIRMADO },
    });
    await this.logDteAction(dteId, 'SIGNED', { auto: true });
    this.logger.log(`[AUTO] DTE ${dteId} signed successfully`);
    this.triggerWebhook(tenantId, 'dte.signed', {
      dteId: dte.id, codigoGeneracion: dte.codigoGeneracion, estado: 'FIRMADO',
    }, dte.id);

    // Step 3: Get auth token and transmit
    const tokenInfo = await this.haciendaAuthService.getTokenForTenant(tenantId, haciendaEnv);

    const identificacion = jsonOriginalParsed?.identificacion as Record<string, unknown> | undefined;
    const ambiente = ((identificacion?.ambiente as string) || '00') as '00' | '01';

    const request: SendDTERequest = {
      ambiente,
      idEnvio: Date.now(),
      version: DTE_VERSIONS[dte.tipoDte as TipoDte],
      tipoDte: dte.tipoDte as TipoDte,
      documento: jsonFirmado,
      codigoGeneracion: dte.codigoGeneracion,
    };

    try {
      const response = await sendDTE(tokenInfo.token, request, { env: mhEnv });

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: response.selloRecibido || undefined,
          fechaRecepcion: response.fhProcesamiento ? new Date(response.fhProcesamiento) : null,
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED', { response, auto: true });
      this.logger.log(`[AUTO] DTE ${dteId} transmitted successfully. Sello: ${response.selloRecibido}`);

      this.sendDteEmail(dte, dte.tenant).catch(err =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );
      this.triggerWebhook(tenantId, 'dte.approved', {
        dteId: dte.id, codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: response.selloRecibido, estado: 'PROCESADO',
        fechaAprobacion: response.fhProcesamiento,
      }, dte.id);
      this.triggerAccountingEntry(dte.id, tenantId, 'ON_APPROVED');
    } catch (error) {
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

      await this.logDteAction(dteId, 'TRANSMISSION_ERROR', { error: errorMessage, observaciones, auto: true });
      this.logger.error(`[AUTO] DTE ${dteId} transmission failed: ${errorMessage}`);

      this.triggerWebhook(tenantId, 'dte.rejected', {
        dteId: dte.id, codigoGeneracion: dte.codigoGeneracion,
        estado: 'RECHAZADO', error: errorMessage, observaciones,
      }, dte.id);
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

      // Trigger accounting entry on approval (fire-and-forget)
      this.triggerAccountingEntry(dte.id, dte.tenantId, 'ON_APPROVED');

      return updated;
    }

    try {
      // Get auth token
      const tenantAmbiente = await this.resolveAmbiente(dte.tenantId);
      const env: 'test' | 'prod' = tenantAmbiente === '01' ? 'prod' : 'test';
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

      // Trigger accounting entry on approval (fire-and-forget)
      this.triggerAccountingEntry(dte.id, dte.tenantId, 'ON_APPROVED');

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
    tenant?: { id?: string; nombre: string; nit: string; nrc: string; direccion?: string | null; telefono: string; correo: string; logoUrl?: string | null } | null,
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
        logoUrl: tenant.logoUrl ?? undefined,
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
        logoUrl: dte.tenant.logoUrl ?? undefined,
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
    if (!motivo || motivo.trim().length < 10) {
      throw new BadRequestException('El motivo de anulación debe tener al menos 10 caracteres');
    }

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

    if (dte.estado === DTEStatus.ANULADO) {
      throw new BadRequestException('El DTE ya está anulado');
    }

    // Only allow cancellation for PENDIENTE, FIRMADO, PROCESADO states
    const cancelableStates: string[] = [DTEStatus.PENDIENTE, DTEStatus.FIRMADO, DTEStatus.PROCESADO];
    if (!cancelableStates.includes(dte.estado)) {
      throw new BadRequestException(`No se puede anular un DTE en estado ${dte.estado}`);
    }

    const fechaAnulacion = new Date();
    let selloAnulacion: string | null = null;
    let descripcionMh = `Anulado: ${motivo}`;

    // If the DTE was PROCESADO by Hacienda, we should note that MH anulation
    // should be done via /transmitter/anular endpoint with MH credentials.
    // The local anulation marks it locally; MH anulation requires separate step.
    if (dte.estado === DTEStatus.PROCESADO && dte.selloRecepcion) {
      descripcionMh = `Anulado localmente: ${motivo}. Requiere anulación en Hacienda via transmitter.`;
      this.logger.warn(
        `DTE ${dteId} (${dte.codigoGeneracion}) anulado localmente pero tiene sello MH. ` +
        `Se recomienda enviar anulación a Hacienda.`,
      );
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        estado: DTEStatus.ANULADO,
        descripcionMh,
        motivoAnulacion: motivo.trim(),
        fechaAnulacion,
        selloAnulacion,
      },
    });

    await this.logDteAction(dteId, 'ANULADO', {
      motivo,
      estadoAnterior: dte.estado,
      teniaSelloMh: !!dte.selloRecepcion,
      fechaAnulacion: fechaAnulacion.toISOString(),
    });

    // Trigger accounting reversal (fire-and-forget)
    this.triggerAccountingReversal(dteId, dte.tenantId);

    // Trigger webhook (fire-and-forget)
    this.triggerWebhook(dte.tenantId, 'dte.anulado', {
      dteId,
      codigoGeneracion: dte.codigoGeneracion,
      numeroControl: dte.numeroControl,
      motivo,
      estadoAnterior: dte.estado,
    }, dteId);

    return updated;
  }

  /**
   * Resolve the MH ambiente code from the tenant's HaciendaConfig.
   * PRODUCTION → '01', TEST/default → '00'
   */
  /**
   * Normalize DTE JSON to comply with Hacienda's schema for the specific tipoDte.
   * Adds emisor from tenant data, fixes receptor format, and adjusts fields for CCF (03).
   */
  private async normalizeJsonForHacienda(
    tenantId: string,
    tipoDte: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Load tenant with sucursal info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        sucursales: {
          where: { activa: true },
          orderBy: { esPrincipal: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant no encontrado');
    }

    const sucursal = tenant.sucursales[0];
    const identificacion = (data.identificacion as Record<string, unknown>) || {};
    const receptor = (data.receptor as Record<string, unknown>) || {};
    const cuerpoDocumento = (data.cuerpoDocumento as Array<Record<string, unknown>>) || [];
    const resumen = (data.resumen as Record<string, unknown>) || {};

    // Build emisor from tenant data (required for tipo 03, good practice for all)
    let direccionEmisor: Record<string, unknown>;
    try {
      direccionEmisor = typeof tenant.direccion === 'string' ? JSON.parse(tenant.direccion) : tenant.direccion as Record<string, unknown>;
    } catch {
      direccionEmisor = { departamento: '06', municipio: '14', complemento: tenant.direccion || '' };
    }
    // If direccion is a flat string instead of an object, wrap it
    if (typeof direccionEmisor === 'string' || !direccionEmisor?.departamento) {
      direccionEmisor = { departamento: '06', municipio: '14', complemento: String(direccionEmisor || tenant.direccion || '') };
    }

    const emisor = {
      nit: (tenant.nit || '').replace(/-/g, ''),
      nrc: (tenant.nrc || '').replace(/-/g, ''),
      nombre: tenant.nombre || '',
      codActividad: tenant.actividadEcon || '62010',
      descActividad: ACTIVIDAD_ECONOMICA_MAP[tenant.actividadEcon] || ((data.emisor as Record<string, unknown>)?.descActividad as string) || 'Servicios',
      nombreComercial: tenant.nombreComercial || null,
      tipoEstablecimiento: sucursal?.tipoEstablecimiento || '01',
      direccion: direccionEmisor,
      telefono: tenant.telefono || '00000000',
      correo: tenant.correo || '',
      codEstableMH: sucursal?.codEstableMH || null,
      codEstable: sucursal?.codEstable || null,
      codPuntoVentaMH: null,
      codPuntoVenta: null,
    };

    if (tipoDte === '05' || tipoDte === '06') {
      // === Nota de Crédito (05) / Nota de Débito (06) normalization ===
      // Similar to CCF: uses ReceptorCCF format, requires documentoRelacionado, no ivaItem in items
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      // Receptor same format as CCF (NIT-based)
      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        nit: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
      };

      // NC/ND items: no ivaItem field, requires numeroDocumento per item
      const normalizedCuerpo = cuerpoDocumento.map(item => {
        const { ivaItem: _ivaItem, ...rest } = item;
        return {
          ...rest,
          numeroDocumento: item.numeroDocumento ?? '',
          codTributo: item.codTributo ?? null,
        };
      });

      // Resumen: same as CCF format (tributos array, no totalIva)
      const totalGravada = Number(resumen.totalGravada) || 0;
      const IVA_RATE = 0.13;
      const ivaAmount = Math.round(totalGravada * IVA_RATE * 100) / 100;

      const tributos = totalGravada > 0 ? [{
        codigo: '20',
        descripcion: 'Impuesto al Valor Agregado 13%',
        valor: ivaAmount,
      }] : null;

      const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

      const { totalIva: _totalIva, ...resumenRest } = resumen;
      const normalizedResumen: Record<string, unknown> = {
        ...resumenRest,
        tributos,
        subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: Number(resumen.reteRenta) || 0,
        montoTotalOperacion,
        totalPagar: montoTotalOperacion,
        totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
        condicionOperacion: Number(resumen.condicionOperacion) || 1,
      };

      // Nota de Débito has numPagoElectronico
      if (tipoDte === '06') {
        normalizedResumen.numPagoElectronico = resumen.numPagoElectronico ?? null;
      }

      // NC/ND emisor omits establishment codes
      const { codEstableMH: _codEstMH, codEstable: _codEst, codPuntoVentaMH: _codPvMH, codPuntoVenta: _codPv, ...emisorSinEstablecimiento } = emisor;

      return {
        identificacion: normalizedIdentificacion,
        documentoRelacionado: (data.documentoRelacionado as unknown) ?? (data.documentosRelacionados as unknown) ?? [],
        emisor: emisorSinEstablecimiento,
        receptor: normalizedReceptor,
        ventaTercero: (data.ventaTercero as unknown) ?? null,
        cuerpoDocumento: normalizedCuerpo,
        resumen: normalizedResumen,
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '07') {
      // === Comprobante de Retención (07) normalization ===
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      // Receptor same as CCF
      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        nit: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
      };

      // Retention items have a different structure
      const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
        numItem: (item.numItem as number) || index + 1,
        tipoDte: (item.tipoDte as string) || '03',
        tipoDoc: (item.tipoDoc as number) || 2,
        numDocumento: (item.numDocumento as string) || (item.numeroDocumento as string) || '',
        fechaEmision: (item.fechaEmision as string) || '',
        montoSujetoGrav: Number(item.montoSujetoGrav) || 0,
        codigoRetencionMH: (item.codigoRetencionMH as string) || 'C4',
        ivaRetenido: Number(item.ivaRetenido) || 0,
        descripcion: (item.descripcion as string) || '',
      }));

      const totalSujetoRetencion = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoSujetoGrav, 0) * 100) / 100;
      const totalIVAretenido = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.ivaRetenido, 0) * 100) / 100;

      const { codEstableMH: _codEstMH, codEstable: _codEst, codPuntoVentaMH: _codPvMH, codPuntoVenta: _codPv, ...emisorSinEstablecimiento } = emisor;

      return {
        identificacion: normalizedIdentificacion,
        emisor: emisorSinEstablecimiento,
        receptor: normalizedReceptor,
        cuerpoDocumento: normalizedCuerpo,
        resumen: {
          totalSujetoRetencion,
          totalIVAretenido,
          totalIVAretenidoLetras: (resumen.totalIVAretenidoLetras as string) || numberToWords(totalIVAretenido),
        },
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '34') {
      // === Comprobante de Retención Simplificado (34) normalization ===
      // Multiple retenciones with tipoImpuesto/tasa/monto structure
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      // Receptor same as CCF (NIT-based)
      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        nit: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
      };

      // Retenciones: from cuerpoDocumento or data.retenciones
      const retenciones = (data.retenciones as Array<Record<string, unknown>>) || cuerpoDocumento;
      const normalizedCuerpo = retenciones.map((item, index) => ({
        numItem: (item.numItem as number) || index + 1,
        tipoImpuesto: (item.tipoImpuesto as string) || (item.tipo_impuesto as string) || 'ISR',
        descripcion: (item.descripcion as string) || '',
        tasa: Number(item.tasa) || 0,
        montoSujetoRetencion: Math.round((Number(item.montoSujetoRetencion ?? item.monto_sujeto_retencion) || 0) * 100) / 100,
        montoRetencion: Math.round((Number(item.montoRetencion ?? item.monto_retencion) || 0) * 100) / 100,
      }));

      const totalSujetoRetencion = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoSujetoRetencion, 0) * 100) / 100;
      const totalRetenido = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoRetencion, 0) * 100) / 100;

      const { codEstableMH: _codEstMH34, codEstable: _codEst34, codPuntoVentaMH: _codPvMH34, codPuntoVenta: _codPv34, ...emisorSinEstablecimiento34 } = emisor;

      return {
        identificacion: normalizedIdentificacion,
        emisor: emisorSinEstablecimiento34,
        receptor: normalizedReceptor,
        documentoRelacionado: (data.documentoRelacionado as unknown) ?? null,
        cuerpoDocumento: normalizedCuerpo,
        resumen: {
          totalSujetoRetencion,
          totalRetenido,
          totalRetenidoLetras: (resumen.totalRetenidoLetras as string) || numberToWords(totalRetenido),
        },
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '14') {
      // === Factura de Sujeto Excluido (14) normalization ===
      // No IVA, uses sujetoExcluido instead of receptor
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      const sujetoExcluido = (data.sujetoExcluido as Record<string, unknown>) || receptor;

      let seDireccion = sujetoExcluido.direccion;
      if (typeof seDireccion === 'string') {
        try {
          seDireccion = JSON.parse(seDireccion);
        } catch {
          seDireccion = { departamento: '06', municipio: '14', complemento: seDireccion };
        }
      }
      if (!seDireccion || typeof seDireccion !== 'object' || !(seDireccion as Record<string, unknown>).departamento) {
        seDireccion = { departamento: '06', municipio: '14', complemento: String(seDireccion || '') };
      }

      const normalizedSujetoExcluido = {
        tipoDocumento: (sujetoExcluido.tipoDocumento as string) || '13',
        numDocumento: (sujetoExcluido.numDocumento as string) || null,
        nombre: (sujetoExcluido.nombre as string) || '',
        codActividad: (sujetoExcluido.codActividad as string) || null,
        descActividad: (sujetoExcluido.descActividad as string) || null,
        direccion: seDireccion,
        telefono: (sujetoExcluido.telefono as string) || null,
        correo: (sujetoExcluido.correo as string) || '',
      };

      // Items: no IVA, uses compra field
      const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
        numItem: (item.numItem as number) || index + 1,
        tipoItem: (item.tipoItem as number) || 1,
        cantidad: Number(item.cantidad) || 1,
        codigo: (item.codigo as string) || null,
        uniMedida: (item.uniMedida as number) || 59,
        descripcion: (item.descripcion as string) || '',
        precioUni: Number(item.precioUnitario ?? item.precioUni) || 0,
        montoDescu: Number(item.montoDescu) || 0,
        compra: Math.round((Number(item.cantidad) || 1) * Number(item.precioUnitario ?? item.precioUni ?? 0) * 100) / 100,
      }));

      const totalCompra = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.compra, 0) * 100) / 100;

      const condicionOperacion = Number(resumen.condicionOperacion) || 1;
      const pagos = condicionOperacion !== 2 ? [{
        codigo: '01',
        montoPago: totalCompra,
        referencia: null,
        plazo: null,
        periodo: null,
      }] : null;

      return {
        identificacion: normalizedIdentificacion,
        emisor,
        sujetoExcluido: normalizedSujetoExcluido,
        cuerpoDocumento: normalizedCuerpo,
        resumen: {
          totalCompra,
          descu: 0,
          totalDescu: 0,
          subTotal: totalCompra,
          ivaRete1: 0,
          reteRenta: Number(resumen.reteRenta) || 0,
          totalPagar: totalCompra,
          totalLetras: (resumen.totalLetras as string) || numberToWords(totalCompra),
          condicionOperacion,
          pagos,
          observaciones: (resumen.observaciones as string) || null,
        },
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '04') {
      // === Nota de Remisión (04) normalization ===
      // Similar structure to NC/ND: documentoRelacionado, receptor with bienTitulo, tributos
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        nit: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
        bienTitulo: (receptor.bienTitulo as string) || '01',
      };

      // NR items: same as NC/ND items (no ivaItem, has numeroDocumento)
      const normalizedCuerpo = cuerpoDocumento.map(item => {
        const { ivaItem: _ivaItem, ...rest } = item;
        return {
          ...rest,
          numeroDocumento: item.numeroDocumento ?? '',
          codTributo: item.codTributo ?? null,
        };
      });

      // Resumen with tributos (same as CCF/NC/ND)
      const totalGravada = Number(resumen.totalGravada) || 0;
      const IVA_RATE = 0.13;
      const ivaAmount = Math.round(totalGravada * IVA_RATE * 100) / 100;

      const tributos = totalGravada > 0 ? [{
        codigo: '20',
        descripcion: 'Impuesto al Valor Agregado 13%',
        valor: ivaAmount,
      }] : null;

      const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

      const { totalIva: _totalIva04, ...resumenRest04 } = resumen;
      const normalizedResumen04: Record<string, unknown> = {
        ...resumenRest04,
        tributos,
        subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: Number(resumen.reteRenta) || 0,
        montoTotalOperacion,
        totalPagar: montoTotalOperacion,
        totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
        condicionOperacion: Number(resumen.condicionOperacion) || 1,
      };

      return {
        identificacion: normalizedIdentificacion,
        documentoRelacionado: (data.documentoRelacionado as unknown) ?? (data.documentosRelacionados as unknown) ?? [],
        emisor,
        receptor: normalizedReceptor,
        ventaTercero: (data.ventaTercero as unknown) ?? null,
        cuerpoDocumento: normalizedCuerpo,
        resumen: normalizedResumen04,
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '09') {
      // === Documento Contable de Liquidación (09) normalization ===
      // Unique: cuerpoDocumento is a single object (NOT array), tipoModelo/tipoOperacion are const=1
      // No tipoContingencia/motivoContin in identificacion
      const { tipoContingencia: _tc, motivoContin: _mc, ...identRest09 } = identificacion;
      const normalizedIdentificacion = {
        ...identRest09,
        tipoModelo: 1,
        tipoOperacion: 1,
      };

      // Receptor same format as CCF
      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        tipoDocumento: (receptor.tipoDocumento as string) || '36',
        numDocumento: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
      };

      // DCL emisor needs codigoMH, codigo, puntoVentaMH, puntoVentaContri
      const emisorDCL = {
        ...emisor,
        codigoMH: emisor.codEstableMH,
        codigo: emisor.codEstable,
        puntoVentaMH: emisor.codPuntoVentaMH,
        puntoVentaContri: emisor.codPuntoVenta,
      };

      // cuerpoDocumento is a single object for DCL
      const cuerpoItem = cuerpoDocumento[0] || (data.cuerpoDocumento as Record<string, unknown>) || {};
      const valorOperaciones = Number(cuerpoItem.valorOperaciones) || 0;
      const IVA_RATE = 0.13;
      const PERCEPCION_RATE = 0.02;
      const montoSinPercepcion = Number(cuerpoItem.montoSinPercepcion) || 0;
      const montoSujetoPercepcion = valorOperaciones - montoSinPercepcion;
      const ivaPercibido = Math.round(montoSujetoPercepcion * PERCEPCION_RATE * 100) / 100;
      const subTotal = Math.round(valorOperaciones * (1 + IVA_RATE) * 100) / 100;
      const comision = Number(cuerpoItem.comision) || 0;
      const ivaComision = Math.round(comision * IVA_RATE * 100) / 100;
      const liquidoApagar = Math.round((subTotal - ivaPercibido - comision - ivaComision) * 100) / 100;

      const normalizedCuerpo = {
        numItem: 1,
        tipoDte: (cuerpoItem.tipoDte as string) || '03',
        tipoGeneracion: (cuerpoItem.tipoGeneracion as number) || 1,
        numeroDocumento: (cuerpoItem.numeroDocumento as string) || null,
        periodoLiquidacionFechaInicio: (cuerpoItem.periodoLiquidacionFechaInicio as string) || '',
        periodoLiquidacionFechaFin: (cuerpoItem.periodoLiquidacionFechaFin as string) || '',
        codLiquidacion: (cuerpoItem.codLiquidacion as number) || 1,
        cantidadDoc: (cuerpoItem.cantidadDoc as number) || 1,
        valorOperaciones,
        montoSinPercepcion,
        descripcion: (cuerpoItem.descripcion as string) || '',
      };

      const normalizedResumen09 = {
        totalNoGravado: 0,
        totalGravada: valorOperaciones,
        totalIva: Math.round(valorOperaciones * IVA_RATE * 100) / 100,
        subTotal,
        montoSujetoPercepcion,
        ivaPercibido,
        comision,
        porcentComision: Number(cuerpoItem.porcentComision) || 0,
        ivaComision,
        liquidoApagar,
        totalLetras: (resumen.totalLetras as string) || numberToWords(liquidoApagar),
        observaciones: (resumen.observaciones as string) || null,
      };

      // Extension is required for DCL
      const extensionData = (data.extension as Record<string, unknown>) || {};
      const normalizedExtension = {
        nombEntrega: (extensionData.nombEntrega as string) || '',
        docuEntrega: (extensionData.docuEntrega as string) || '',
        nombRecibe: (extensionData.nombRecibe as string) || '',
        docuRecibe: (extensionData.docuRecibe as string) || '',
        observaciones: (extensionData.observaciones as string) || null,
      };

      return {
        identificacion: normalizedIdentificacion,
        emisor: emisorDCL,
        receptor: normalizedReceptor,
        cuerpoDocumento: normalizedCuerpo,
        resumen: normalizedResumen09,
        extension: normalizedExtension,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '11') {
      // === Factura de Exportación (11) normalization ===
      // 0% IVA, international receptor with codPais/nombrePais, Incoterms
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      // Emisor with export-specific fields
      const emisorData = (data.emisor as Record<string, unknown>) || {};
      const emisorExport = {
        ...emisor,
        tipoItemExpor: (emisorData.tipoItemExpor as number) || 1,
        recintoFiscal: (emisorData.recintoFiscal as string) || null,
        regimen: (emisorData.regimen as string) || null,
      };

      // Receptor: international format
      const normalizedReceptor = receptor.nombre ? {
        tipoDocumento: (receptor.tipoDocumento as string) || null,
        numDocumento: (receptor.numDocumento as string) || null,
        nombre: (receptor.nombre as string) || '',
        codPais: (receptor.codPais as string) || '9303',
        nombrePais: (receptor.nombrePais as string) || '',
        complemento: (receptor.complemento as string) || '',
        tipoPersona: (receptor.tipoPersona as number) || null,
        descActividad: (receptor.descActividad as string) || null,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || null,
      } : null;

      // Items: export items have ventaGravada and noGravado, no ivaItem/tipoItem
      const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
        numItem: (item.numItem as number) || index + 1,
        cantidad: Number(item.cantidad) || 1,
        codigo: (item.codigo as string) || null,
        uniMedida: (item.uniMedida as number) || 59,
        descripcion: (item.descripcion as string) || '',
        precioUni: Number(item.precioUnitario ?? item.precioUni) || 0,
        montoDescu: Number(item.montoDescu) || 0,
        ventaGravada: Math.round((Number(item.cantidad) || 1) * Number(item.precioUnitario ?? item.precioUni ?? 0) * 100) / 100,
        tributos: null,
        noGravado: Number(item.noGravado) || 0,
      }));

      const totalGravada = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.ventaGravada, 0) * 100) / 100;
      const totalNoGravado = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.noGravado, 0) * 100) / 100;
      const flete = Number(resumen.flete ?? data.flete) || 0;
      const seguro = Number(resumen.seguro ?? data.seguro) || 0;
      const montoTotalOperacion = Math.round((totalGravada + totalNoGravado) * 100) / 100;
      const totalPagar = montoTotalOperacion;

      const normalizedResumen11 = {
        totalGravada,
        totalNoGravado,
        descuento: Number(resumen.descuento) || 0,
        porcentajeDescuento: Number(resumen.porcentajeDescuento) || 0,
        totalDescu: Number(resumen.totalDescu) || 0,
        montoTotalOperacion,
        totalPagar,
        totalLetras: (resumen.totalLetras as string) || numberToWords(totalPagar),
        condicionOperacion: Number(resumen.condicionOperacion) || 1,
        pagos: resumen.pagos ?? [{
          codigo: '01',
          montoPago: totalPagar,
          referencia: null,
          plazo: null,
          periodo: null,
        }],
        codIncoterms: (resumen.codIncoterms as string) || (data.codIncoterms as string) || null,
        descIncoterms: (resumen.descIncoterms as string) || (data.descIncoterms as string) || null,
        flete,
        seguro,
        observaciones: (resumen.observaciones as string) || (data.observaciones as string) || null,
        numPagoElectronico: (resumen.numPagoElectronico as string) || null,
      };

      return {
        identificacion: normalizedIdentificacion,
        emisor: emisorExport,
        receptor: normalizedReceptor,
        otrosDocumentos: (data.otrosDocumentos as unknown) ?? null,
        cuerpoDocumento: normalizedCuerpo,
        resumen: normalizedResumen11,
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    if (tipoDte === '03') {
      // === CCF (Crédito Fiscal) normalization ===

      // Fix identificacion: add motivoContin if missing
      const normalizedIdentificacion = {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      };

      // Fix receptor: CCF uses nit instead of numDocumento, requires nombreComercial

      // Ensure direccion is an object {departamento, municipio, complemento}
      let receptorDireccion = receptor.direccion;
      if (typeof receptorDireccion === 'string') {
        try {
          receptorDireccion = JSON.parse(receptorDireccion);
        } catch {
          receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
        }
      }
      if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
        receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
      }

      const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
      const normalizedReceptor = {
        nit: receptorNit,
        nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
        nombre: (receptor.nombre as string) || '',
        codActividad: (receptor.codActividad as string) || '62010',
        descActividad: (receptor.descActividad as string) || 'Servicios',
        nombreComercial: (receptor.nombreComercial as string) || null,
        direccion: receptorDireccion,
        telefono: (receptor.telefono as string) || null,
        correo: (receptor.correo as string) || '',
      };

      // Fix cuerpoDocumento: remove ivaItem, add numeroDocumento and codTributo
      const normalizedCuerpo = cuerpoDocumento.map(item => {
        const { ivaItem: _ivaItem, ...rest } = item;
        return {
          ...rest,
          numeroDocumento: item.numeroDocumento ?? null,
          codTributo: item.codTributo ?? null,
        };
      });

      // Fix resumen: replace totalIva with ivaPerci1/ivaRete1
      const totalGravada = Number(resumen.totalGravada) || 0;
      const IVA_RATE = 0.13;
      const ivaAmount = Math.round(totalGravada * IVA_RATE * 100) / 100;

      const tributos = totalGravada > 0 ? [{
        codigo: '20',
        descripcion: 'Impuesto al Valor Agregado 13%',
        valor: ivaAmount,
      }] : null;

      const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

      const { totalIva: _totalIva, ...resumenRest } = resumen;
      const normalizedResumen = {
        ...resumenRest,
        tributos,
        subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: Number(resumen.reteRenta) || 0,
        montoTotalOperacion,
        totalPagar: montoTotalOperacion,
        totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
        saldoFavor: Number(resumen.saldoFavor) || 0,
        condicionOperacion: Number(resumen.condicionOperacion) || 1,
        pagos: resumen.pagos ?? (Number(resumen.condicionOperacion) !== 2 ? [{
          codigo: '01',
          montoPago: montoTotalOperacion,
          referencia: null,
          plazo: null,
          periodo: null,
        }] : null),
        numPagoElectronico: resumen.numPagoElectronico ?? null,
      };

      return {
        identificacion: normalizedIdentificacion,
        documentoRelacionado: (data.documentoRelacionado as unknown) ?? null,
        emisor,
        receptor: normalizedReceptor,
        otrosDocumentos: (data.otrosDocumentos as unknown) ?? null,
        ventaTercero: (data.ventaTercero as unknown) ?? null,
        cuerpoDocumento: normalizedCuerpo,
        resumen: normalizedResumen,
        extension: (data.extension as unknown) ?? null,
        apendice: (data.apendice as unknown) ?? null,
      };
    }

    // === Factura (01) - just add emisor and null fields if missing ===
    return {
      ...data,
      identificacion: {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      },
      emisor: data.emisor || emisor,
      documentoRelacionado: data.documentoRelacionado ?? null,
      otrosDocumentos: data.otrosDocumentos ?? null,
      ventaTercero: data.ventaTercero ?? null,
      extension: data.extension ?? null,
      apendice: data.apendice ?? null,
    };
  }

  private async resolveAmbiente(tenantId: string): Promise<'00' | '01'> {
    try {
      const haciendaConfig = await this.prisma.haciendaConfig.findUnique({
        where: { tenantId },
      });
      if (haciendaConfig?.activeEnvironment === 'PRODUCTION') {
        return '01';
      }
    } catch (err) {
      this.logger.warn(`Failed to resolve ambiente for tenant ${tenantId}: ${err instanceof Error ? err.message : err}`);
    }
    return '00';
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

  private async generateNumeroControl(
    tenantId: string,
    tipoDte: string,
    correlativo: number,
    sucursalId?: string,
    puntoVentaId?: string,
  ): Promise<string> {
    let codEstablecimiento = 'M001P001'; // Default fallback

    if (this.sucursalesService) {
      try {
        codEstablecimiento = await this.sucursalesService.getCodEstablecimiento(
          tenantId,
          sucursalId,
          puntoVentaId,
        );
      } catch (err) {
        this.logger.warn(`Failed to get codEstablecimiento for tenant ${tenantId}: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Ensure 8 chars (M###P###)
    const codPadded = codEstablecimiento.padStart(8, '0').slice(0, 8);
    return `DTE-${tipoDte}-${codPadded}-${correlativo.toString().padStart(15, '0')}`;
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

  /**
   * Fire-and-forget accounting entry generation. Errors are logged but never thrown.
   */
  private triggerAccountingEntry(dteId: string, tenantId: string, trigger: string): void {
    if (!this.accountingAutomation) return;
    this.accountingAutomation.generateFromDTE(dteId, tenantId, trigger).catch((err) =>
      this.logger.error(`Accounting auto-entry failed for DTE ${dteId}: ${err instanceof Error ? err.message : err}`),
    );
  }

  /**
   * Fire-and-forget accounting reversal. Errors are logged but never thrown.
   */
  private triggerAccountingReversal(dteId: string, tenantId: string): void {
    if (!this.accountingAutomation) return;
    this.accountingAutomation.reverseFromDTE(dteId, tenantId).catch((err) =>
      this.logger.error(`Accounting reversal failed for DTE ${dteId}: ${err instanceof Error ? err.message : err}`),
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

    // Get client names (tenant-scoped)
    const clientIds = stats.map((s: typeof stats[0]) => s.clienteId).filter(Boolean) as string[];
    const clients = await this.prisma.cliente.findMany({
      where: { id: { in: clientIds }, tenantId },
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
