import { ConflictException, PreconditionFailedException } from '@nestjs/common';
import { DteImportService } from './dte-import.service';
import { DteImportParserService, ParseResult, ParsedDTE } from './dte-import-parser.service';
import { MhDteConsultaService, MhVerifyResult } from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

type PrismaMock = {
  tenant: { findUnique: jest.Mock };
  receivedDTE: { findUnique: jest.Mock; create: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    tenant: { findUnique: jest.fn() },
    receivedDTE: { findUnique: jest.fn(), create: jest.fn() },
  };
}

const validParsedDTE: ParsedDTE = {
  tipoDte: '03',
  version: 3,
  ambiente: '00',
  numeroControl: 'DTE-03-AB12CD34-000000000000001',
  codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
  tipoModelo: 1,
  tipoOperacion: 1,
  fecEmi: '2026-04-15',
  horEmi: '14:30:45',
  tipoMoneda: 'USD',
  emisor: { nit: '06141507251041', nombre: 'Proveedor Test SA' },
  receptor: { nit: '06231507251041', nombre: 'Receptor SA' },
  cuerpoDocumento: [],
  resumen: { totalPagar: '113.00' },
  raw: '{"dummy":"raw"}',
};

const validTenant = {
  id: 'tenant-1',
  nit: '06141507251041',
  haciendaConfig: {
    environmentConfig: {
      password: 'fake-mh-password',
      ambiente: '00',
    },
  },
};

function makeService(overrides?: Partial<{
  parser: Partial<DteImportParserService>;
  consulta: Partial<MhDteConsultaService>;
  mhAuth: Partial<MhAuthService>;
  prisma: PrismaMock;
}>) {
  const parser = {
    parse: jest.fn().mockReturnValue({ valid: true, data: validParsedDTE, errors: [] } as ParseResult),
    parseObject: jest.fn(),
    ...(overrides?.parser ?? {}),
  } as unknown as DteImportParserService;

  const consulta = {
    verify: jest.fn().mockResolvedValue({
      status: 'VERIFIED',
      mhSelloRecepcion: 'MH-SELLO-X',
      mhFhProcesamiento: new Date('2026-04-15T14:30:45Z'),
      durationMs: 120,
    } as MhVerifyResult),
    ...(overrides?.consulta ?? {}),
  } as unknown as MhDteConsultaService;

  const mhAuth = {
    getToken: jest.fn().mockResolvedValue({
      token: 'fake-token',
      roles: [],
      obtainedAt: new Date(),
    }),
    ...(overrides?.mhAuth ?? {}),
  } as unknown as MhAuthService;

  const prisma = overrides?.prisma ?? mockPrisma();
  (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(validTenant);
  (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.receivedDTE.create as jest.Mock).mockImplementation(({ data }: { data: object }) => ({
    id: 'rdte-new',
    ...data,
  }));

  const service = new DteImportService(parser, consulta, mhAuth, prisma as unknown as PrismaService);
  return { service, parser, consulta, mhAuth, prisma };
}

const baseParams = {
  tenantId: 'tenant-1',
  jsonString: '{"dummy":"raw"}',
  createdBy: 'user-1',
  source: 'JSON_UPLOAD' as const,
};

describe('DteImportService', () => {
  it('happy path: parse OK + verify VERIFIED → persist VERIFIED', async () => {
    const { service, consulta, prisma } = makeService();

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('VERIFIED');
    expect(result.isDuplicate).toBe(false);
    expect(result.parseErrors).toEqual([]);
    expect(consulta.verify).toHaveBeenCalledTimes(1);
    expect(prisma.receivedDTE.create).toHaveBeenCalledTimes(1);
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('VERIFIED');
    expect(createCall.data.rawPayloadHash).toHaveLength(64);
    expect(createCall.data.mhVerifyAttempts).toBe(1);
  });

  it('parse fail: persist FAILED_PARSE, do not call verify', async () => {
    const { service, consulta, prisma } = makeService({
      parser: {
        parse: jest.fn().mockReturnValue({
          valid: false,
          errors: [{ code: 'INVALID_JSON', message: 'Bad JSON' }],
        }),
      },
    });

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('FAILED_PARSE');
    expect(result.parseErrors).toHaveLength(1);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).toHaveBeenCalledTimes(1);
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('FAILED_PARSE');
    expect(createCall.data.ingestErrors).toContain('INVALID_JSON');
  });

  it('dedupe same hash: return existing, no INSERT, no verify', async () => {
    const prisma = mockPrisma();
    const { service, consulta } = makeService({ prisma });

    // Same jsonString → same hash → existing record matches
    const hash = require('crypto').createHash('sha256').update(baseParams.jsonString).digest('hex');
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'rdte-existing',
      rawPayloadHash: hash,
      ingestStatus: 'VERIFIED',
      codigoGeneracion: validParsedDTE.codigoGeneracion,
    });

    const result = await service.ingest(baseParams);

    expect(result.isDuplicate).toBe(true);
    expect(result.existingReceivedDteId).toBe('rdte-existing');
    expect(result.receivedDteId).toBe('rdte-existing');
    expect(result.ingestStatus).toBe('VERIFIED');
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('dedupe different hash: throws ConflictException, no verify, no INSERT', async () => {
    const prisma = mockPrisma();
    const { service, consulta } = makeService({ prisma });

    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'rdte-existing',
      rawPayloadHash: 'DIFFERENT_HASH_1234567890abcdef1234567890abcdef1234567890abcdef1234',
      ingestStatus: 'VERIFIED',
      codigoGeneracion: validParsedDTE.codigoGeneracion,
    });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(ConflictException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('no MH config: throws PreconditionFailedException, no persist', async () => {
    const prisma = mockPrisma();
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'tenant-1',
      nit: '06141507251041',
      haciendaConfig: null,
    });
    const { service, consulta } = makeService({ prisma });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('MH token fetch fails: throws PreconditionFailedException', async () => {
    const { service, consulta, prisma } = makeService({
      mhAuth: {
        getToken: jest.fn().mockRejectedValue(new Error('MH down')),
      },
    });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('MH NOT_FOUND: persist FAILED_MH_NOT_FOUND', async () => {
    const { service, prisma } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'HARD_FAIL_NOT_FOUND',
          httpStatus: 404,
          durationMs: 150,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('FAILED_MH_NOT_FOUND');
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('FAILED_MH_NOT_FOUND');
  });

  it('MH MISMATCH: persist STRUCTURAL_OK (flag for review)', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'HARD_FAIL_MISMATCH',
          httpStatus: 200,
          errorMessage: 'sello mismatch',
          durationMs: 100,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('STRUCTURAL_OK');
  });

  it('MH TIMEOUT: persist VERIFY_TIMEOUT_RETRY with attempts=1', async () => {
    const { service, prisma } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_TIMEOUT',
          errorMessage: 'timeout',
          durationMs: 5000,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_TIMEOUT_RETRY');
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.mhVerifyAttempts).toBe(1);
    expect(createCall.data.lastMhVerifyAt).toBeInstanceOf(Date);
    expect(createCall.data.mhVerifyError).toBe('timeout');
  });

  it('MH 5XX: persist VERIFY_5XX_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_5XX',
          httpStatus: 500,
          durationMs: 200,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_5XX_RETRY');
  });

  it('MH AUTH: persist VERIFY_AUTH_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_AUTH',
          httpStatus: 401,
          durationMs: 50,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_AUTH_RETRY');
  });

  it('MH UNKNOWN_ERROR: treated as transient → VERIFY_5XX_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'UNKNOWN_ERROR',
          errorMessage: 'weird',
          durationMs: 100,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_5XX_RETRY');
  });
});
