import { createHash } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { DteImportParserService, ParseError } from './dte-import-parser.service';
import {
  MhDteConsultaService,
  MhVerifyResult,
  MhVerifyStatus,
} from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

export type IngestStatus =
  | 'VERIFIED'
  | 'STRUCTURAL_OK'
  | 'FAILED_PARSE'
  | 'FAILED_MH_NOT_FOUND'
  | 'VERIFY_TIMEOUT_RETRY'
  | 'VERIFY_5XX_RETRY'
  | 'VERIFY_AUTH_RETRY'
  | 'UNVERIFIED';

export type IngestSource = 'JSON_UPLOAD' | 'OCR_PDF' | 'MANUAL_ENTRY' | 'API_WEBHOOK';

export interface IngestParams {
  tenantId: string;
  jsonString: string;
  createdBy: string;
  source: IngestSource;
}

export interface IngestResult {
  receivedDteId: string;
  codigoGeneracion: string;
  ingestStatus: IngestStatus;
  isDuplicate: boolean;
  existingReceivedDteId?: string;
  parseErrors: ParseError[];
  mhVerifyResult?: MhVerifyResult;
}

export const MH_TO_INGEST: Record<MhVerifyStatus, IngestStatus> = {
  VERIFIED: 'VERIFIED',
  HARD_FAIL_NOT_FOUND: 'FAILED_MH_NOT_FOUND',
  HARD_FAIL_MISMATCH: 'STRUCTURAL_OK',
  RETRY_TIMEOUT: 'VERIFY_TIMEOUT_RETRY',
  RETRY_5XX: 'VERIFY_5XX_RETRY',
  RETRY_AUTH: 'VERIFY_AUTH_RETRY',
  UNKNOWN_ERROR: 'VERIFY_5XX_RETRY', // treat as transient
};

@Injectable()
export class DteImportService {
  private readonly logger = new Logger(DteImportService.name);

  constructor(
    private readonly parser: DteImportParserService,
    private readonly consulta: MhDteConsultaService,
    private readonly mhAuth: MhAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async ingest(params: IngestParams): Promise<IngestResult> {
    const { tenantId, jsonString, createdBy, source } = params;

    // 1. Parse
    const parsed = this.parser.parse(jsonString);

    if (!parsed.valid || !parsed.data) {
      const rawPayloadHash = this.hash(jsonString);
      const record = await this.prisma.receivedDTE.create({
        data: {
          tenantId,
          tipoDte: 'UNKNOWN',
          numeroControl: 'UNKNOWN',
          codigoGeneracion: `FAILED_PARSE-${rawPayloadHash.slice(0, 16)}-${Date.now()}`,
          fhEmision: new Date(),
          emisorNIT: 'UNKNOWN',
          emisorNombre: 'UNKNOWN',
          rawPayload: jsonString,
          rawPayloadHash,
          ingestStatus: 'FAILED_PARSE',
          ingestErrors: JSON.stringify(parsed.errors),
          ingestSource: source,
          createdBy,
          mhVerifyAttempts: 0,
        },
      });

      return {
        receivedDteId: record.id,
        codigoGeneracion: record.codigoGeneracion,
        ingestStatus: 'FAILED_PARSE',
        isDuplicate: false,
        parseErrors: parsed.errors,
      };
    }

    const data = parsed.data;

    // 2. Hash
    const rawPayloadHash = this.hash(jsonString);

    // 3. Dedupe
    const existing = await this.prisma.receivedDTE.findUnique({
      where: {
        tenantId_codigoGeneracion: {
          tenantId,
          codigoGeneracion: data.codigoGeneracion,
        },
      },
    });

    if (existing) {
      if (existing.rawPayloadHash === rawPayloadHash) {
        this.logger.debug(
          `Duplicate ingest (same hash) for codigoGeneracion=${data.codigoGeneracion}, returning existing ${existing.id}`,
        );
        return {
          receivedDteId: existing.id,
          codigoGeneracion: existing.codigoGeneracion,
          ingestStatus: existing.ingestStatus as IngestStatus,
          isDuplicate: true,
          existingReceivedDteId: existing.id,
          parseErrors: [],
        };
      }
      throw new ConflictException({
        message: 'codigoGeneracion already ingested with different content (hash mismatch)',
        existingReceivedDteId: existing.id,
        existingHash: existing.rawPayloadHash,
        newHash: rawPayloadHash,
      });
    }

    // 4. Resolve MH auth
    const auth = await this.resolveMhAuth(tenantId);

    // 5. Verify against MH
    const verifyResult = await this.consulta.verify({
      codigoGeneracion: data.codigoGeneracion,
      ambiente: auth.ambiente,
      mhToken: auth.token,
      timeoutMs: 5000,
    });

    // 6. Map + 7. Persist
    const ingestStatus = MH_TO_INGEST[verifyResult.status];
    const fhEmision = new Date(`${data.fecEmi}T${data.horEmi}`);

    const record = await this.prisma.receivedDTE.create({
      data: {
        tenantId,
        tipoDte: data.tipoDte,
        numeroControl: data.numeroControl,
        codigoGeneracion: data.codigoGeneracion,
        selloRecepcion: verifyResult.mhSelloRecepcion ?? data.selloRecepcion ?? null,
        fhProcesamiento: verifyResult.mhFhProcesamiento ?? data.fhProcesamiento ?? null,
        fhEmision,
        emisorNIT: data.emisor.nit ?? data.emisor.numDocumento ?? 'UNKNOWN',
        emisorNombre: data.emisor.nombre,
        rawPayload: jsonString,
        parsedPayload: JSON.stringify(data),
        rawPayloadHash,
        ingestStatus,
        ingestSource: source,
        mhVerifyAttempts: 1,
        lastMhVerifyAt: new Date(),
        mhVerifyError: verifyResult.errorMessage ?? null,
        createdBy,
      },
    });

    return {
      receivedDteId: record.id,
      codigoGeneracion: record.codigoGeneracion,
      ingestStatus,
      isDuplicate: false,
      parseErrors: [],
      mhVerifyResult: verifyResult,
    };
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private async resolveMhAuth(
    tenantId: string,
  ): Promise<{ token: string; ambiente: '00' | '01' }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        haciendaConfig: {
          include: { environmentConfigs: true },
        },
      },
    });

    if (!tenant) {
      throw new PreconditionFailedException(`Tenant ${tenantId} not found`);
    }

    const hc = (tenant as {
      haciendaConfig?: {
        environmentConfig?: { password?: string; ambiente?: string };
        environmentConfigs?: { password?: string; ambiente?: string }[];
      };
    }).haciendaConfig;
    // Support both mock shape (singular) and real DB shape (plural array)
    const envCfg =
      hc?.environmentConfig ??
      (hc?.environmentConfigs && hc.environmentConfigs.length > 0
        ? hc.environmentConfigs[0]
        : undefined);
    if (!hc || !envCfg || !envCfg.password || !envCfg.ambiente) {
      throw new PreconditionFailedException(
        `Tenant ${tenantId} has no active HaciendaConfig — cannot verify DTEs against MH`,
      );
    }

    const mhEnv = envCfg.ambiente === '01' ? 'prod' : 'test';
    const ambiente = envCfg.ambiente as '00' | '01';

    try {
      const tokenInfo = await this.mhAuth.getToken(tenant.nit, envCfg.password, mhEnv);
      return { token: tokenInfo.token, ambiente };
    } catch (err) {
      throw new PreconditionFailedException(
        `Failed to obtain MH token for tenant ${tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
    }
  }
}
