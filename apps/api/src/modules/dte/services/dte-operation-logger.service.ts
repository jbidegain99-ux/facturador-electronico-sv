import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteErrorMapperService, ErrorContext, MappedError } from './error-mapper.service';

interface OperationContext {
  dteType?: string;
  dteNumber?: string;
  emitterNit?: string;
  receiverNit?: string;
  receiverName?: string;
  total?: number;
  itemsCount?: number;
}

interface ErrorLogContext {
  field?: string;
  value?: string;
  expectedFormat?: string;
  mhResponse?: ErrorContext['mhResponse'];
}

@Injectable()
export class DteOperationLoggerService {
  private readonly logger = new Logger('DteOperationLogger');

  constructor(
    private prisma: PrismaService,
    private errorMapper: DteErrorMapperService,
  ) {}

  async logOperationStart(
    tenantId: string,
    dteId: string,
    operationType: 'VALIDATION' | 'SIGNING' | 'TRANSMISSION' | 'RECEIPT',
    context: OperationContext,
  ): Promise<string> {
    const opLog = await this.prisma.dteOperationLog.create({
      data: {
        tenantId,
        dteId,
        operationType,
        status: 'START',
        timestamp: new Date(),
        dteType: context.dteType,
        dteNumber: context.dteNumber,
        emitterNit: context.emitterNit,
        receiverNit: context.receiverNit,
        operationDetails: JSON.stringify({
          receiverName: context.receiverName,
          total: context.total,
          itemsCount: context.itemsCount,
        }),
      },
    });

    this.logger.debug(`[${tenantId}] ${operationType} started for DTE ${dteId}`);
    return opLog.id;
  }

  async logOperationSuccess(operationLogId: string): Promise<void> {
    await this.prisma.dteOperationLog.update({
      where: { id: operationLogId },
      data: { status: 'SUCCESS' },
    });
    this.logger.debug(`Operation ${operationLogId} succeeded`);
  }

  async logOperationError(
    operationLogId: string,
    tenantId: string,
    dteId: string,
    error: Error | string,
    context: ErrorLogContext,
    operationType?: 'VALIDATION' | 'SIGNING' | 'TRANSMISSION',
  ): Promise<MappedError> {
    const mappedError = this.errorMapper.mapError({
      rawError: error,
      field: context.field,
      value: context.value,
      expectedFormat: context.expectedFormat,
      mhResponse: context.mhResponse,
    });

    const errorDetailJson = JSON.stringify({
      errorCode: mappedError.errorCode,
      errorType: mappedError.errorType,
      userMessage: mappedError.userMessage,
      suggestedAction: mappedError.suggestedAction,
      field: context.field || null,
      value: context.value || null,
      resolvable: mappedError.resolvable,
      timestamp: new Date().toISOString(),
    });

    // 1. Save to DteErrorLog (full audit history)
    await this.prisma.dteErrorLog.create({
      data: {
        operationLogId,
        tenantId,
        dteId,
        timestamp: new Date(),
        errorType: mappedError.errorType,
        errorCode: mappedError.errorCode,
        rawErrorMessage: error instanceof Error ? error.stack : String(error),
        field: context.field,
        value: context.value ? String(context.value) : null,
        expectedFormat: context.expectedFormat,
        mhStatusCode: context.mhResponse?.status,
        mhResponseBody: context.mhResponse ? JSON.stringify(context.mhResponse) : null,
        userFriendlyMessage: mappedError.userMessage,
        suggestedAction: mappedError.suggestedAction,
        resolvable: mappedError.resolvable,
      },
    });

    // 2. Persist error on the DTE record itself (for tenant UI display)
    try {
      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          lastError: errorDetailJson,
          lastErrorAt: new Date(),
          lastErrorOperationType: operationType || 'TRANSMISSION',
        },
      });
    } catch (updateErr) {
      this.logger.warn(`Failed to update DTE ${dteId} with lastError: ${updateErr instanceof Error ? updateErr.message : updateErr}`);
    }

    // 3. Mark operation as FAILED
    await this.prisma.dteOperationLog.update({
      where: { id: operationLogId },
      data: { status: 'FAILED' },
    });

    this.logger.error(`[${tenantId}] DTE ${dteId} error: ${mappedError.errorCode}`);
    return mappedError;
  }

  async getTenantErrors(tenantId: string, limit = 20) {
    return this.prisma.dteErrorLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        timestamp: true,
        errorCode: true,
        errorType: true,
        field: true,
        userFriendlyMessage: true,
        suggestedAction: true,
        resolvable: true,
        dteId: true,
        mhStatusCode: true,
      },
    });
  }

  async getErrorSummary(tenantId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.dteErrorLog.findMany({
      where: {
        tenantId,
        timestamp: { gte: sevenDaysAgo },
      },
      select: {
        errorType: true,
        errorCode: true,
        resolvable: true,
      },
    });

    const byType: Record<string, number> = {};
    const byCode: Record<string, number> = {};
    let resolvableCount = 0;

    for (const log of logs) {
      byType[log.errorType] = (byType[log.errorType] || 0) + 1;
      byCode[log.errorCode] = (byCode[log.errorCode] || 0) + 1;
      if (log.resolvable) resolvableCount++;
    }

    return {
      total: logs.length,
      byType,
      byCode,
      resolvable: resolvableCount,
    };
  }

  async getOperationLogs(tenantId: string, limit = 20) {
    return this.prisma.dteOperationLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        errors: {
          select: {
            id: true,
            errorCode: true,
            userFriendlyMessage: true,
            resolvable: true,
          },
        },
      },
    });
  }
}
