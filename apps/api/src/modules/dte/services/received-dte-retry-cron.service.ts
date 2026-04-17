import {
  Injectable,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { MHEnvironment } from '@facturador/mh-client';
import {
  MhDteConsultaService,
  MhVerifyResult,
  MhVerifyStatus,
} from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { MH_TO_INGEST, IngestStatus } from './dte-import.service';

// =========================================================================
// Public constants + pure function
// =========================================================================

export const MAX_ATTEMPTS = 6;

type RetryStatus = 'VERIFY_TIMEOUT_RETRY' | 'VERIFY_5XX_RETRY' | 'VERIFY_AUTH_RETRY';

const RETRY_STATUSES: ReadonlyArray<RetryStatus> = [
  'VERIFY_TIMEOUT_RETRY',
  'VERIFY_5XX_RETRY',
  'VERIFY_AUTH_RETRY',
];

/**
 * Minutes to wait between this attempt and the next retry attempt for a given DTE.
 * AUTH: always 5 min (the fix is re-authentication, not backoff).
 * TIMEOUT / 5XX: exponential backoff 5 * 2^(attempts-1), capped at 160 min.
 *
 * Pure function — safe to export for tests.
 */
export function nextRetryGapMinutes(attempts: number, status: RetryStatus): number {
  if (status === 'VERIFY_AUTH_RETRY') return 5;
  const gap = 5 * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(gap, 160);
}

// =========================================================================
// Result types
// =========================================================================

export interface RetryBatchReport {
  scannedCount: number;
  skippedGapCount: number;
  skippedAuthCount: number;
  retriedCount: number;
  verifiedCount: number;
  terminalCount: number;
  finalizedCount: number;
  stillRetryingCount: number;
  errorCount: number;
  durationMs: number;
}

export interface RetryResult {
  receivedDteId: string;
  previousStatus: string;
  newStatus: string;
  previousAttempts: number;
  newAttempts: number;
  optimisticLockConflict?: boolean;
}

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class ReceivedDteRetryCronService {
  private readonly logger = new Logger(ReceivedDteRetryCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consulta: MhDteConsultaService,
    private readonly mhAuth: MhAuthService,
  ) {}

  @Cron('*/5 * * * *', { name: 'received-dte-retry' })
  async handleRetryBatch(): Promise<RetryBatchReport> {
    const started = Date.now();
    const report: RetryBatchReport = {
      scannedCount: 0,
      skippedGapCount: 0,
      skippedAuthCount: 0,
      retriedCount: 0,
      verifiedCount: 0,
      terminalCount: 0,
      finalizedCount: 0,
      stillRetryingCount: 0,
      errorCount: 0,
      durationMs: 0,
    };

    // 1. Query candidates
    const candidates = await this.prisma.receivedDTE.findMany({
      where: {
        ingestStatus: { in: RETRY_STATUSES as unknown as string[] },
        mhVerifyAttempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { lastMhVerifyAt: 'asc' },
      take: 50,
    });
    report.scannedCount = candidates.length;

    // 2. Gap filter
    const now = Date.now();
    const retryable = candidates.filter((c) => {
      const gapMs =
        nextRetryGapMinutes(c.mhVerifyAttempts, c.ingestStatus as RetryStatus) * 60_000;
      const elapsed = now - (c.lastMhVerifyAt?.getTime() ?? 0);
      return elapsed >= gapMs;
    });
    report.skippedGapCount = candidates.length - retryable.length;

    // 3. Group by tenantId
    const groups = new Map<string, typeof retryable>();
    for (const c of retryable) {
      if (!groups.has(c.tenantId)) groups.set(c.tenantId, []);
      groups.get(c.tenantId)!.push(c);
    }

    // 4. Process each tenant group
    for (const [tenantId, group] of groups.entries()) {
      let auth: { token: string; ambiente: '00' | '01' };
      try {
        auth = await this.resolveMhAuth(tenantId);
      } catch (err) {
        this.logger.warn(
          `Skipping ${group.length} retries for tenant ${tenantId}: auth failed (${
            err instanceof Error ? err.message : 'unknown'
          })`,
        );
        report.skippedAuthCount += group.length;
        continue;
      }

      // Process concurrently, max 5 at a time
      await this.processConcurrently(group, 5, async (candidate) => {
        try {
          const verifyResult = await this.consulta.verify({
            codigoGeneracion: candidate.codigoGeneracion,
            ambiente: auth.ambiente,
            mhToken: auth.token,
            timeoutMs: 5000,
          });
          report.retriedCount += 1;
          await this.applyVerifyResult(candidate, verifyResult, report);
        } catch (err) {
          report.errorCount += 1;
          this.logger.error(
            `Retry failed for DTE ${candidate.id}: ${
              err instanceof Error ? err.message : 'unknown'
            }`,
          );
        }
      });
    }

    report.durationMs = Date.now() - started;
    this.logger.log(
      `Retry batch: scanned=${report.scannedCount} retried=${report.retriedCount} ` +
        `verified=${report.verifiedCount} terminal=${report.terminalCount} ` +
        `finalized=${report.finalizedCount} skipped=${report.skippedGapCount + report.skippedAuthCount} ` +
        `errors=${report.errorCount} duration=${report.durationMs}ms`,
    );
    return report;
  }

  async retryOne(receivedDteId: string): Promise<RetryResult> {
    const dte = await this.prisma.receivedDTE.findUnique({
      where: { id: receivedDteId },
    });
    if (!dte) {
      throw new NotFoundException(`ReceivedDTE ${receivedDteId} not found`);
    }
    if (!RETRY_STATUSES.includes(dte.ingestStatus as RetryStatus)) {
      throw new PreconditionFailedException(
        `ReceivedDTE ${receivedDteId} is not in a retry state (current: ${dte.ingestStatus})`,
      );
    }

    const auth = await this.resolveMhAuth(dte.tenantId);
    const verifyResult = await this.consulta.verify({
      codigoGeneracion: dte.codigoGeneracion,
      ambiente: auth.ambiente,
      mhToken: auth.token,
      timeoutMs: 5000,
    });

    // Dummy report for applyVerifyResult contract — caller ignores counts
    const scratch: RetryBatchReport = {
      scannedCount: 1,
      skippedGapCount: 0,
      skippedAuthCount: 0,
      retriedCount: 1,
      verifiedCount: 0,
      terminalCount: 0,
      finalizedCount: 0,
      stillRetryingCount: 0,
      errorCount: 0,
      durationMs: 0,
    };

    const { newStatus, newAttempts, optimisticLockConflict } = await this.applyVerifyResult(
      dte,
      verifyResult,
      scratch,
    );

    return {
      receivedDteId: dte.id,
      previousStatus: dte.ingestStatus,
      newStatus,
      previousAttempts: dte.mhVerifyAttempts,
      newAttempts,
      optimisticLockConflict,
    };
  }

  // =======================================================================
  // Private helpers
  // =======================================================================

  private async applyVerifyResult(
    dte: { id: string; mhVerifyAttempts: number; ingestStatus: string },
    verifyResult: MhVerifyResult,
    report: RetryBatchReport,
  ): Promise<{ newStatus: IngestStatus; newAttempts: number; optimisticLockConflict?: boolean }> {
    const newAttempts = dte.mhVerifyAttempts + 1;
    let newStatus: IngestStatus;
    let mhVerifyError: string | null = verifyResult.errorMessage ?? null;

    const isTerminal =
      verifyResult.status === 'VERIFIED' ||
      verifyResult.status === 'HARD_FAIL_NOT_FOUND' ||
      verifyResult.status === 'HARD_FAIL_MISMATCH';

    if (verifyResult.status === 'VERIFIED') {
      newStatus = 'VERIFIED';
      report.verifiedCount += 1;
    } else if (verifyResult.status === 'HARD_FAIL_NOT_FOUND') {
      newStatus = 'FAILED_MH_NOT_FOUND';
      report.terminalCount += 1;
    } else if (verifyResult.status === 'HARD_FAIL_MISMATCH') {
      newStatus = 'STRUCTURAL_OK';
      report.terminalCount += 1;
    } else {
      // RETRY_* or UNKNOWN_ERROR
      if (newAttempts >= MAX_ATTEMPTS) {
        newStatus = 'UNVERIFIED';
        mhVerifyError = 'Max retry attempts reached. Manual intervention required.';
        report.finalizedCount += 1;
      } else {
        newStatus = MH_TO_INGEST[verifyResult.status as MhVerifyStatus];
        report.stillRetryingCount += 1;
      }
    }

    // Build update data (only set sello/fhProcesamiento on VERIFIED)
    const updateData: Record<string, unknown> = {
      ingestStatus: newStatus,
      mhVerifyAttempts: newAttempts,
      lastMhVerifyAt: new Date(),
      mhVerifyError,
    };
    if (newStatus === 'VERIFIED' && verifyResult.mhSelloRecepcion) {
      updateData.selloRecepcion = verifyResult.mhSelloRecepcion;
    }
    if (newStatus === 'VERIFIED' && verifyResult.mhFhProcesamiento) {
      updateData.fhProcesamiento = verifyResult.mhFhProcesamiento;
    }

    // Optimistic concurrency: WHERE attempts = previous
    const result = await this.prisma.receivedDTE.updateMany({
      where: {
        id: dte.id,
        mhVerifyAttempts: dte.mhVerifyAttempts,
      },
      data: updateData,
    });

    const optimisticLockConflict = result.count === 0;
    if (optimisticLockConflict) {
      this.logger.warn(
        `Optimistic lock conflict on DTE ${dte.id} — another process updated it first`,
      );
    }

    // Ensure terminal flag used (suppress unused warning)
    void isTerminal;

    return { newStatus, newAttempts, optimisticLockConflict };
  }

  private async resolveMhAuth(
    tenantId: string,
  ): Promise<{ token: string; ambiente: '00' | '01' }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        haciendaConfig: { include: { environmentConfig: true } as never },
      },
    });

    if (!tenant) {
      throw new PreconditionFailedException(`Tenant ${tenantId} not found`);
    }

    const hc = (tenant as { haciendaConfig?: { environmentConfig?: { password?: string; ambiente?: string }; environmentConfigs?: Array<{ password?: string; ambiente?: string }> } }).haciendaConfig;
    const envCfg = hc?.environmentConfig ?? hc?.environmentConfigs?.[0];
    if (!hc || !envCfg || !envCfg.password || !envCfg.ambiente) {
      throw new PreconditionFailedException(
        `Tenant ${tenantId} has no active HaciendaConfig`,
      );
    }

    const mhEnv: MHEnvironment = envCfg.ambiente === '01' ? 'prod' : 'test';
    const ambiente = envCfg.ambiente as '00' | '01';
    const tokenInfo = await this.mhAuth.getToken(tenant.nit, envCfg.password, mhEnv);
    return { token: tokenInfo.token, ambiente };
  }

  private async processConcurrently<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
  ): Promise<void> {
    const queue = [...items];
    const running: Promise<void>[] = [];

    while (queue.length > 0 || running.length > 0) {
      while (running.length < concurrency && queue.length > 0) {
        const item = queue.shift()!;
        const p = worker(item).finally(() => {
          const idx = running.indexOf(p);
          if (idx >= 0) running.splice(idx, 1);
        });
        running.push(p);
      }
      if (running.length > 0) {
        await Promise.race(running);
      }
    }
  }
}
