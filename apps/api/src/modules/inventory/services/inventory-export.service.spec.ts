import { Test } from '@nestjs/testing';
import { InventoryExportService } from './inventory-export.service';
import { InventoryService } from './inventory.service';
import * as ExcelJS from 'exceljs';

describe('InventoryExportService', () => {
  let service: InventoryExportService;
  let inventoryService: { findAll: jest.Mock };

  beforeEach(async () => {
    inventoryService = { findAll: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        InventoryExportService,
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();
    service = module.get(InventoryExportService);
  });

  it('generates XLSX buffer with 9 header columns', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [
        {
          catalogItemId: 'c1',
          code: 'P-001',
          description: 'Producto 1',
          categoryId: null,
          categoryName: null,
          currentQty: 10,
          currentAvgCost: 5,
          totalValue: 50,
          reorderLevel: 2,
          lastMovementAt: '2026-01-15T10:00:00.000Z',
          status: 'OK',
        },
      ],
      total: 1, totalPages: 1, page: 1, limit: 10000,
    });

    const buf = await service.exportStockList('t1', {});
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    const headerRow = sheet.getRow(1);
    expect(headerRow.getCell(1).value).toBe('Código');
    expect(headerRow.getCell(2).value).toBe('Descripción');
    expect(headerRow.getCell(3).value).toBe('Categoría');
    expect(headerRow.getCell(4).value).toBe('Stock actual');
    expect(headerRow.getCell(5).value).toBe('Costo promedio');
    expect(headerRow.getCell(6).value).toBe('Valor total');
    expect(headerRow.getCell(7).value).toBe('Reorder level');
    expect(headerRow.getCell(8).value).toBe('Último movimiento');
    expect(headerRow.getCell(9).value).toBe('Estado');
    expect(sheet.getRow(2).getCell(1).value).toBe('P-001');
    expect(sheet.getRow(2).getCell(9).value).toBe('OK');
  });

  it('generates XLSX with headers only when no data', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [], total: 0, totalPages: 1, page: 1, limit: 10000,
    });
    const buf = await service.exportStockList('t1', {});
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    expect(sheet.rowCount).toBe(1); // headers only
  });

  it('calls InventoryService.findAll with limit 10000 cap', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [], total: 0, totalPages: 1, page: 1, limit: 10000,
    });
    await service.exportStockList('t1', { search: 'x' });
    expect(inventoryService.findAll).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ search: 'x', limit: 10000, page: 1 }),
    );
  });

  it('maps status to Spanish label in output', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [
        { catalogItemId: 'c1', code: 'A', description: 'A', categoryId: null, categoryName: null,
          currentQty: 0, currentAvgCost: 0, totalValue: 0, reorderLevel: 5, lastMovementAt: null, status: 'OUT_OF_STOCK' },
        { catalogItemId: 'c2', code: 'B', description: 'B', categoryId: null, categoryName: null,
          currentQty: 2, currentAvgCost: 1, totalValue: 2, reorderLevel: 5, lastMovementAt: null, status: 'BELOW_REORDER' },
      ],
      total: 2, totalPages: 1, page: 1, limit: 10000,
    });
    const buf = await service.exportStockList('t1', {});
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    expect(sheet.getRow(2).getCell(9).value).toBe('Sin stock');
    expect(sheet.getRow(3).getCell(9).value).toBe('Bajo mínimo');
  });
});
