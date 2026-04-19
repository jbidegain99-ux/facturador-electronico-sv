import { Test } from '@nestjs/testing';
import { PhysicalCountCsvService } from './physical-count-csv.service';

describe('PhysicalCountCsvService', () => {
  let service: PhysicalCountCsvService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PhysicalCountCsvService],
    }).compile();
    service = module.get(PhysicalCountCsvService);
  });

  it('parses valid CSV with correct header', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10.0000,8.0000,reconteo ok
P-002,Prod 2,5.0000,7.0000,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toEqual({
      rowNumber: 2, code: 'P-001', countedQty: 8, notes: 'reconteo ok',
    });
    expect(r.rows[1]).toEqual({
      rowNumber: 3, code: 'P-002', countedQty: 7, notes: '',
    });
    expect(r.errors).toHaveLength(0);
  });

  it('trims + uppercases code', () => {
    const csv = `code,description,systemQty,countedQty,notes
  p-001  ,Prod 1,10,8,
`;
    const r = service.parse(csv);
    expect(r.rows[0].code).toBe('P-001');
  });

  it('handles UTF-8 BOM', () => {
    const csv = '\uFEFFcode,description,systemQty,countedQty,notes\nP-001,Prod 1,10,8,\n';
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].code).toBe('P-001');
  });

  it('reports error on invalid countedQty (non-numeric)', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10,abc,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ rowNumber: 2, code: 'P-001', reason: 'INVALID_QTY' });
  });

  it('skips rows with empty countedQty without error', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10,,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
    expect(r.skipped).toBe(1);
  });

  it('reports error on empty code', () => {
    const csv = `code,description,systemQty,countedQty,notes
,Prod X,10,5,
`;
    const r = service.parse(csv);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ rowNumber: 2, reason: 'EMPTY_CODE' });
  });

  it('rejects CSV without required header columns', () => {
    const csv = `wrongcol\nvalue\n`;
    const r = service.parse(csv);
    expect(r.errors[0]).toMatchObject({ reason: 'INVALID_HEADER' });
  });
});
