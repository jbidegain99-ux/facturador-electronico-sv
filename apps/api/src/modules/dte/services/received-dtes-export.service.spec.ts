import { Test } from '@nestjs/testing';
import { PayloadTooLargeException } from '@nestjs/common';
import { ReceivedDtesExportService } from './received-dtes-export.service';
import { ReceivedDtesService } from './received-dtes.service';

describe('ReceivedDtesExportService', () => {
  let service: ReceivedDtesExportService;
  let received: { findAllForExport: jest.Mock };

  beforeEach(async () => {
    received = { findAllForExport: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ReceivedDtesExportService,
        { provide: ReceivedDtesService, useValue: received },
      ],
    }).compile();
    service = module.get(ReceivedDtesExportService);
  });

  it('produces non-empty XLSX Buffer for happy row', async () => {
    received.findAllForExport.mockResolvedValue([{
      id: 'r1', tipoDte: '01', codigoGeneracion: 'CG', numeroControl: 'NC',
      emisorNIT: '0614', emisorNombre: 'X', ingestStatus: 'VERIFIED', ingestSource: 'CRON',
      mhVerifyAttempts: 1, lastMhVerifyAt: null, mhVerifyError: null, ingestErrors: null,
      selloRecepcion: 'SELLO', parsedPayload: JSON.stringify({ resumen: { totalGravada: 100, totalIva: 13, totalPagar: 113 } }),
      purchase: { id: 'p1', purchaseNumber: 'PUR-1' }, fhEmision: new Date('2026-04-10'), createdAt: new Date(),
    }]);
    const buf = await service.exportXlsx('t1', {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('throws 413 TOO_MANY if rows > 10000', async () => {
    received.findAllForExport.mockResolvedValue(new Array(10001).fill({
      id: 'x', tipoDte: '01', codigoGeneracion: 'CG', numeroControl: 'NC',
      emisorNIT: '0', emisorNombre: 'X', ingestStatus: 'PENDING', ingestSource: 'CRON',
      mhVerifyAttempts: 0, lastMhVerifyAt: null, mhVerifyError: null, ingestErrors: null,
      selloRecepcion: null, parsedPayload: null, purchase: null, fhEmision: new Date(), createdAt: new Date(),
    }));
    await expect(service.exportXlsx('t1', {})).rejects.toThrow(PayloadTooLargeException);
  });

  it('returns empty workbook buffer for 0 rows', async () => {
    received.findAllForExport.mockResolvedValue([]);
    const buf = await service.exportXlsx('t1', {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(500);
  });

  it('passes filters through to findAllForExport', async () => {
    received.findAllForExport.mockResolvedValue([]);
    await service.exportXlsx('t1', { desde: '2026-04-01', status: 'FAILED' });
    expect(received.findAllForExport).toHaveBeenCalledWith('t1', { desde: '2026-04-01', status: 'FAILED' });
  });
});
