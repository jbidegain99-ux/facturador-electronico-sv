import {
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import {
  ReceivedDteRetryCronService,
  nextRetryGapMinutes,
  MAX_ATTEMPTS,
} from './received-dte-retry-cron.service';
import { MhDteConsultaService, MhVerifyResult } from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  receivedDTE: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  tenant: { findUnique: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    receivedDTE: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    tenant: { findUnique: jest.fn() },
  };
}

const validTenant = {
  id: 'tenant-1',
  nit: '06141507251041',
  haciendaConfig: {
    environmentConfigs: [{ password: 'fake-pwd', ambiente: '00' }],
  },
};

function makeCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rdte-1',
    tenantId: 'tenant-1',
    codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    ingestStatus: 'VERIFY_TIMEOUT_RETRY',
    mhVerifyAttempts: 1,
    lastMhVerifyAt: new Date(Date.now() - 10 * 60_000), // 10 min ago
    selloRecepcion: null,
    fhProcesamiento: null,
    mhVerifyError: null,
    ...overrides,
  };
}

function makeService(prisma: PrismaMock) {
  const consulta = {
    verify: jest.fn().mockResolvedValue({
      status: 'VERIFIED',
      mhSelloRecepcion: 'MH-SELLO-X',
      mhFhProcesamiento: new Date('2026-04-15T14:30:45Z'),
      durationMs: 100,
    } as MhVerifyResult),
  } as unknown as MhDteConsultaService;

  const mhAuth = {
    getToken: jest.fn().mockResolvedValue({
      token: 'fake-token',
      roles: [],
      obtainedAt: new Date(),
    }),
  } as unknown as MhAuthService;

  (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(validTenant);

  const service = new ReceivedDteRetryCronService(
    prisma as unknown as PrismaService,
    consulta,
    mhAuth,
  );
  return { service, consulta, mhAuth };
}

// =========================================================================
// Pure function tests
// =========================================================================

describe('nextRetryGapMinutes', () => {
  it('1. attempts=1 + TIMEOUT returns 5 min', () => {
    expect(nextRetryGapMinutes(1, 'VERIFY_TIMEOUT_RETRY')).toBe(5);
  });

  it('2. attempts=6 + 5XX returns 160 min (cap)', () => {
    expect(nextRetryGapMinutes(6, 'VERIFY_5XX_RETRY')).toBe(160);
  });

  it('3. attempts=5 + AUTH returns 5 min (override)', () => {
    expect(nextRetryGapMinutes(5, 'VERIFY_AUTH_RETRY')).toBe(5);
  });
});

// =========================================================================
// retryOne tests
// =========================================================================

describe('ReceivedDteRetryCronService.retryOne', () => {
  it('4. RETRY_TIMEOUT + verify VERIFIED → newStatus=VERIFIED, attempts++, sello set', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(makeCandidate({ mhVerifyAttempts: 1 }));
    const { service } = makeService(prisma);

    const result = await service.retryOne('rdte-1');

    expect(result.previousStatus).toBe('VERIFY_TIMEOUT_RETRY');
    expect(result.newStatus).toBe('VERIFIED');
    expect(result.previousAttempts).toBe(1);
    expect(result.newAttempts).toBe(2);

    const updateCall = (prisma.receivedDTE.updateMany as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.ingestStatus).toBe('VERIFIED');
    expect(updateCall.data.selloRecepcion).toBe('MH-SELLO-X');
    expect(updateCall.data.mhVerifyAttempts).toBe(2);
  });

  it('5. Max hit: attempts=5, verify→RETRY_TIMEOUT → newStatus=UNVERIFIED, attempts=6', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(
      makeCandidate({ mhVerifyAttempts: 5 }),
    );
    const { service, consulta } = makeService(prisma);
    (consulta.verify as jest.Mock).mockResolvedValue({
      status: 'RETRY_TIMEOUT',
      errorMessage: 'timeout',
      durationMs: 5000,
    });

    const result = await service.retryOne('rdte-1');

    expect(result.newStatus).toBe('UNVERIFIED');
    expect(result.newAttempts).toBe(6);
    const updateCall = (prisma.receivedDTE.updateMany as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.mhVerifyError).toContain('Max retry attempts');
  });

  it('6. verify→HARD_FAIL_NOT_FOUND → newStatus=FAILED_MH_NOT_FOUND, attempts++', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(makeCandidate({ mhVerifyAttempts: 2 }));
    const { service, consulta } = makeService(prisma);
    (consulta.verify as jest.Mock).mockResolvedValue({
      status: 'HARD_FAIL_NOT_FOUND',
      httpStatus: 404,
      durationMs: 150,
    });

    const result = await service.retryOne('rdte-1');
    expect(result.newStatus).toBe('FAILED_MH_NOT_FOUND');
    expect(result.newAttempts).toBe(3);
  });

  it('7. verify→HARD_FAIL_MISMATCH → newStatus=STRUCTURAL_OK', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(makeCandidate());
    const { service, consulta } = makeService(prisma);
    (consulta.verify as jest.Mock).mockResolvedValue({
      status: 'HARD_FAIL_MISMATCH',
      httpStatus: 200,
      errorMessage: 'sello mismatch',
      durationMs: 100,
    });

    const result = await service.retryOne('rdte-1');
    expect(result.newStatus).toBe('STRUCTURAL_OK');
  });

  it('8. AUTH→AUTH: stays VERIFY_AUTH_RETRY, attempts++', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(
      makeCandidate({ ingestStatus: 'VERIFY_AUTH_RETRY', mhVerifyAttempts: 1 }),
    );
    const { service, consulta } = makeService(prisma);
    (consulta.verify as jest.Mock).mockResolvedValue({
      status: 'RETRY_AUTH',
      httpStatus: 401,
      durationMs: 50,
    });

    const result = await service.retryOne('rdte-1');
    expect(result.newStatus).toBe('VERIFY_AUTH_RETRY');
    expect(result.newAttempts).toBe(2);
  });

  it('9. DTE not found → NotFoundException', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(null);
    const { service } = makeService(prisma);
    await expect(service.retryOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('10. DTE in non-retry status (VERIFIED) → PreconditionFailedException', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(
      makeCandidate({ ingestStatus: 'VERIFIED' }),
    );
    const { service } = makeService(prisma);
    await expect(service.retryOne('rdte-1')).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});

// =========================================================================
// handleRetryBatch tests
// =========================================================================

describe('ReceivedDteRetryCronService.handleRetryBatch', () => {
  it('11. Batch cap: findMany called with take:50', async () => {
    const prisma = mockPrisma();
    const { service } = makeService(prisma);
    await service.handleRetryBatch();
    const findManyCall = (prisma.receivedDTE.findMany as jest.Mock).mock.calls[0][0];
    expect(findManyCall.take).toBe(50);
  });

  it('12. Gap filter: 3 candidates, 2 too-recent → only 1 retried', async () => {
    const prisma = mockPrisma();
    // 3 candidates with attempts=1 → nextGap = 5 min
    (prisma.receivedDTE.findMany as jest.Mock).mockResolvedValue([
      makeCandidate({ id: 'old', lastMhVerifyAt: new Date(Date.now() - 10 * 60_000) }),        // 10min ago — retryable
      makeCandidate({ id: 'recent1', lastMhVerifyAt: new Date(Date.now() - 2 * 60_000) }),     // 2min ago — skip
      makeCandidate({ id: 'recent2', lastMhVerifyAt: new Date(Date.now() - 30_000) }),          // 30sec ago — skip
    ]);
    const { service, consulta } = makeService(prisma);

    const report = await service.handleRetryBatch();

    expect(report.scannedCount).toBe(3);
    expect(report.skippedGapCount).toBe(2);
    expect(report.retriedCount).toBe(1);
    expect(consulta.verify).toHaveBeenCalledTimes(1);
  });

  it('13. Multi-tenant: 2 tenants grouped, auth resolved once per tenant', async () => {
    const prisma = mockPrisma();
    (prisma.receivedDTE.findMany as jest.Mock).mockResolvedValue([
      makeCandidate({ id: 'a1', tenantId: 'tenant-a' }),
      makeCandidate({ id: 'a2', tenantId: 'tenant-a' }),
      makeCandidate({ id: 'b1', tenantId: 'tenant-b' }),
      makeCandidate({ id: 'b2', tenantId: 'tenant-b' }),
      makeCandidate({ id: 'b3', tenantId: 'tenant-b' }),
    ]);
    (prisma.tenant.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => ({
      ...validTenant,
      id: where.id,
    }));
    const { service, consulta, mhAuth } = makeService(prisma);

    const report = await service.handleRetryBatch();

    expect(report.retriedCount).toBe(5);
    // Auth resolved exactly once per unique tenantId (2 times)
    expect(mhAuth.getToken).toHaveBeenCalledTimes(2);
    expect(consulta.verify).toHaveBeenCalledTimes(5);
  });
});
