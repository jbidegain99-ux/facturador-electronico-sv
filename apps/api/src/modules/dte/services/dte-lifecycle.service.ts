import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, BadGatewayException, Optional, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SignerService } from '../../signer/signer.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { DefaultEmailService } from '../../email-config/services/default-email.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { AccountingAutomationService } from '../../accounting/accounting-automation.service';
import { HaciendaAuthService } from '../../hacienda/services/hacienda-auth.service';
import { CertificateService } from '../../hacienda/services/certificate.service';
import { EncryptionService } from '../../email-config/services/encryption.service';
import { DteErrorMapperService } from './error-mapper.service';
import { DteOperationLoggerService } from './dte-operation-logger.service';
import { PdfService } from '../pdf.service';
import { invoiceSentTemplate } from '../../email-config/templates';
import { sendDTE, SendDTERequest, MHReceptionError } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';
import { parseMhDate } from '../../../common/utils/parse-mh-date';

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
  FIRMADO: 'FIRMADO',
  PROCESADO: 'PROCESADO',
  RECHAZADO: 'RECHAZADO',
  ANULADO: 'ANULADO',
} as const;

@Injectable()
export class DteLifecycleService {
  private readonly logger = new Logger(DteLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private signerService: SignerService,
    private mhAuthService: MhAuthService,
    private defaultEmailService: DefaultEmailService,
    private pdfService: PdfService,
    @Optional() @Inject(forwardRef(() => WebhooksService)) private webhooksService: WebhooksService | null,
    @Optional() @Inject(forwardRef(() => AccountingAutomationService)) private accountingAutomation: AccountingAutomationService | null,
    private haciendaAuthService: HaciendaAuthService,
    private certificateService: CertificateService,
    private encryptionService: EncryptionService,
    private errorMapper: DteErrorMapperService,
    @Optional() private operationLogger: DteOperationLoggerService | null,
  ) {}

  /**
   * Check if demo mode is enabled for a tenant
   */
  isDemoMode(tenant?: { plan?: string } | null): boolean {
    if (process.env.DEMO_MODE === 'true') return true;
    if (tenant?.plan === 'DEMO' || tenant?.plan === 'TRIAL') return true;
    return false;
  }

  /**
   * Generate simulated Hacienda response for demo mode
   */
  generateDemoResponse(codigoGeneracion: string) {
    const selloRecibido = `DEMO${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      estado: 'PROCESADO',
      selloRecibido,
      fhProcesamiento: new Date().toISOString(),
      observaciones: ['[MODO DEMO] Documento procesado en modo de prueba - No enviado a Hacienda'],
    };
  }

  /**
   * Resolve the MH ambiente code from the tenant's HaciendaConfig.
   * PRODUCTION -> '01', TEST/default -> '00'
   */
  async resolveAmbiente(tenantId: string): Promise<'00' | '01'> {
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

  /**
   * Automatically sign and transmit a DTE after creation.
   */
  async autoSignAndTransmit(dteId: string, tenantId: string): Promise<void> {
    this.logger.log(`[AUTO] Starting auto sign+transmit for DTE ${dteId}`);

    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new Error(`DTE ${dteId} not found for tenant ${tenantId}`);
    }

    let jsonOriginalParsed: Record<string, unknown>;
    try {
      jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch {
      throw new Error(`Failed to parse jsonOriginal for DTE ${dteId}`);
    }

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

    // Step 1: Load tenant's certificate
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

    // Step 2: Sign
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
          fechaRecepcion: parseMhDate(response.fhProcesamiento),
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
          lastError: null,
          lastErrorAt: null,
          lastErrorOperationType: null,
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

  async signDte(dteId: string, tenantId: string) {
    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    let opLogId: string | undefined;
    if (this.operationLogger) {
      try {
        opLogId = await this.operationLogger.logOperationStart(
          dte.tenantId, dteId, 'SIGNING',
          { dteType: dte.tipoDte, dteNumber: dte.numeroControl },
        );
      } catch (logErr) {
        this.logger.warn(`DteOperationLog write failed: ${logErr instanceof Error ? logErr.message : logErr}`);
      }
    }

    let jsonOriginalParsed: Record<string, unknown>;
    try {
      jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch (parseError) {
      this.logger.error(`Failed to parse jsonOriginal for DTE ${dteId}: ${parseError instanceof Error ? parseError.message : parseError}`);
      if (opLogId && this.operationLogger) {
        await this.operationLogger.logOperationError(opLogId, dte.tenantId, dteId, parseError instanceof Error ? parseError : 'JSON parse error', {}, 'SIGNING').catch(() => {});
      }
      throw new InternalServerErrorException('Error al procesar datos del DTE: JSON inválido');
    }

    let jsonFirmado: string;

    try {
      if (this.isDemoMode(dte.tenant)) {
        this.logger.log(`[DEMO MODE] Simulating DTE signing for ${dteId}`);
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
    } catch (signError) {
      if (opLogId && this.operationLogger) {
        await this.operationLogger.logOperationError(
          opLogId, dte.tenantId, dteId,
          signError instanceof Error ? signError : String(signError),
          { field: 'certificate', expectedFormat: 'Valid PFX certificate' },
          'SIGNING',
        ).catch(() => {});
      }
      throw signError;
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        jsonFirmado,
        estado: DTEStatus.FIRMADO,
      },
    });

    if (opLogId && this.operationLogger) {
      await this.operationLogger.logOperationSuccess(opLogId).catch(() => {});
    }

    await this.logDteAction(dteId, 'SIGNED', {
      jsonFirmado: jsonFirmado.substring(0, 100) + '...',
      demoMode: this.isDemoMode(dte.tenant),
    });

    this.triggerWebhook(dte.tenantId, 'dte.signed', {
      dteId: dte.id,
      codigoGeneracion: dte.codigoGeneracion,
      estado: 'FIRMADO',
    }, dte.id);

    return updated;
  }

  async transmitDte(dteId: string, nit: string, password: string, tenantId: string) {
    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }
    if (!dte.jsonFirmado) {
      throw new BadRequestException('El DTE no ha sido firmado. Firme el DTE antes de transmitir.');
    }

    let opLogId: string | undefined;
    if (this.operationLogger) {
      try {
        let receiverName: string | undefined;
        let receiverNit: string | undefined;
        try {
          const parsed = typeof dte.jsonOriginal === 'string' ? JSON.parse(dte.jsonOriginal) : dte.jsonOriginal;
          const receptor = (parsed as Record<string, unknown>).receptor as Record<string, unknown> | undefined;
          receiverName = receptor?.nombre as string | undefined;
          receiverNit = receptor?.numDocumento as string | undefined;
        } catch { /* ignore */ }

        opLogId = await this.operationLogger.logOperationStart(
          dte.tenantId, dteId, 'TRANSMISSION',
          {
            dteType: dte.tipoDte,
            dteNumber: dte.numeroControl,
            emitterNit: nit,
            receiverNit,
            receiverName,
            total: Number(dte.totalPagar) || undefined,
          },
        );
      } catch (logErr) {
        this.logger.warn(`DteOperationLog write failed: ${logErr instanceof Error ? logErr.message : logErr}`);
      }
    }

    // Demo mode
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
          lastError: null,
          lastErrorAt: null,
          lastErrorOperationType: null,
        },
      });

      if (opLogId && this.operationLogger) {
        await this.operationLogger.logOperationSuccess(opLogId).catch(() => {});
      }

      await this.logDteAction(dteId, 'TRANSMITTED_DEMO', { response: demoResponse, demoMode: true });

      this.sendDteEmail(updated, dte.tenant).catch((err) =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );

      this.triggerWebhook(dte.tenantId, 'dte.approved', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: demoResponse.selloRecibido,
        estado: 'PROCESADO',
        fechaAprobacion: demoResponse.fhProcesamiento,
        demoMode: true,
      }, dte.id);

      this.triggerAccountingEntry(dte.id, dte.tenantId, 'ON_APPROVED');

      return updated;
    }

    try {
      const tenantAmbiente = await this.resolveAmbiente(dte.tenantId);
      const env: 'test' | 'prod' = tenantAmbiente === '01' ? 'prod' : 'test';
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

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

      const response = await sendDTE(tokenInfo.token, request, { env });

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: response.selloRecibido || undefined,
          fechaRecepcion: parseMhDate(response.fhProcesamiento),
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
          lastError: null,
          lastErrorAt: null,
          lastErrorOperationType: null,
        },
      });

      if (opLogId && this.operationLogger) {
        await this.operationLogger.logOperationSuccess(opLogId).catch(() => {});
      }

      await this.logDteAction(dteId, 'TRANSMITTED', { response });

      this.sendDteEmail(updated, dte.tenant).catch((err) =>
        this.logger.error(`Failed to send DTE email for ${dteId}: ${err instanceof Error ? err.message : err}`),
      );

      this.triggerWebhook(dte.tenantId, 'dte.approved', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: response.selloRecibido,
        estado: 'PROCESADO',
        fechaAprobacion: response.fhProcesamiento,
      }, dte.id);

      this.triggerAccountingEntry(dte.id, dte.tenantId, 'ON_APPROVED');

      return updated;
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof BadRequestException || error instanceof NotFoundException || error instanceof BadGatewayException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const observaciones = error instanceof MHReceptionError ? error.observaciones : undefined;

      const mapped = this.errorMapper.mapError({
        rawError: error instanceof Error ? error : errorMessage,
        mhResponse: error instanceof MHReceptionError
          ? { status: error.statusCode, data: { observaciones: error.observaciones } }
          : undefined,
      });

      const userDescription = `${mapped.userMessage} | Accion sugerida: ${mapped.suggestedAction}`;

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.RECHAZADO,
          descripcionMh: userDescription,
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMISSION_ERROR', {
        error: errorMessage,
        observaciones,
        userMessage: mapped.userMessage,
        suggestedAction: mapped.suggestedAction,
        errorCode: mapped.errorCode,
        resolvable: mapped.resolvable,
      });

      if (opLogId && this.operationLogger) {
        try {
          await this.operationLogger.logOperationError(
            opLogId, dte.tenantId, dteId,
            error instanceof Error ? error : errorMessage,
            {
              mhResponse: error instanceof MHReceptionError
                ? { status: error.statusCode, data: { observaciones: error.observaciones } }
                : undefined,
            },
            'TRANSMISSION',
          );
        } catch (logErr) {
          this.logger.warn(`DteOperationLog write failed: ${logErr instanceof Error ? logErr.message : logErr}`);
        }
      }

      this.triggerWebhook(dte.tenantId, 'dte.rejected', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        estado: 'RECHAZADO',
        error: errorMessage,
        userMessage: mapped.userMessage,
        observaciones,
      }, dte.id);

      if (error instanceof MHReceptionError) {
        throw new BadRequestException({
          message: mapped.userMessage,
          suggestedAction: mapped.suggestedAction,
          resolvable: mapped.resolvable,
          errorCode: mapped.errorCode,
          observaciones: error.observaciones,
        });
      }

      const isNetworkError = errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('network');
      const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT');

      if (isNetworkError || isTimeoutError) {
        throw new BadGatewayException({
          message: isTimeoutError
            ? 'El Ministerio de Hacienda no respondió a tiempo. Intente nuevamente en unos minutos.'
            : 'No se pudo conectar con el Ministerio de Hacienda. Verifique su conexión e intente nuevamente.',
          suggestedAction: mapped.suggestedAction,
          resolvable: true,
          errorCode: isTimeoutError ? 'MH_TIMEOUT' : 'MH_UNREACHABLE',
        });
      }

      throw new InternalServerErrorException({
        message: mapped.userMessage,
        suggestedAction: mapped.suggestedAction,
        resolvable: mapped.resolvable,
        errorCode: mapped.errorCode,
      });
    }
  }

  async anularDte(dteId: string, motivo: string, tenantId: string) {
    if (!motivo || motivo.trim().length < 10) {
      throw new BadRequestException('El motivo de anulación debe tener al menos 10 caracteres');
    }

    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    if (dte.estado === DTEStatus.ANULADO) {
      throw new BadRequestException('El DTE ya está anulado');
    }

    const cancelableStates: string[] = [DTEStatus.PENDIENTE, DTEStatus.FIRMADO, DTEStatus.PROCESADO];
    if (!cancelableStates.includes(dte.estado)) {
      throw new BadRequestException(`No se puede anular un DTE en estado ${dte.estado}`);
    }

    const fechaAnulacion = new Date();
    const selloAnulacion: string | null = null;
    const descripcionMh = `Anulado: ${motivo}`;

    if (dte.estado === DTEStatus.PROCESADO && dte.selloRecepcion) {
      throw new BadRequestException(
        'Este DTE fue aceptado por Hacienda y no puede anularse localmente. ' +
        'Utilice el proceso de invalidación vía Hacienda (transmitter/anular).',
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

    this.triggerAccountingReversal(dteId, dte.tenantId);

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
   * Send DTE email with PDF attachment to the receptor.
   */
  async sendDteEmail(
    dte: { id: string; tenantId: string; tipoDte: string; codigoGeneracion: string; numeroControl: string; totalPagar: number | { toNumber(): number }; jsonOriginal: string; selloRecepcion?: string | null; estado: string; createdAt: Date },
    tenant?: { id?: string; nombre: string; nit: string; nrc: string; direccion?: string | null; telefono: string; correo: string; logoUrl?: string | null } | null,
  ): Promise<void> {
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
      this.logger.warn(`No receptor email for DTE ${dte.id} (${dte.numeroControl}), skipping email`);
      return;
    }

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

  /**
   * Manually trigger email sending for a DTE.
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

    if (overrideEmail && receptor) {
      receptor.correo = overrideEmail;
      parsedData.receptor = receptor;
    }

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

  // =====================
  // Private helpers
  // =====================

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
      this.logger.error(`Failed to log DTE action [${accion}] for ${dteId}: ${logError instanceof Error ? logError.message : logError}`);
    }
  }

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

  private triggerAccountingEntry(dteId: string, tenantId: string, trigger: string): void {
    if (!this.accountingAutomation) return;
    this.accountingAutomation.generateFromDTE(dteId, tenantId, trigger).catch((err) =>
      this.logger.error(`Accounting auto-entry failed for DTE ${dteId}: ${err instanceof Error ? err.message : err}`),
    );
  }

  private triggerAccountingReversal(dteId: string, tenantId: string): void {
    if (!this.accountingAutomation) return;
    this.accountingAutomation.reverseFromDTE(dteId, tenantId).catch((err) =>
      this.logger.error(`Accounting reversal failed for DTE ${dteId}: ${err instanceof Error ? err.message : err}`),
    );
  }
}
