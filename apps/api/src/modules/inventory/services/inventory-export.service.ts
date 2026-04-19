import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { InventoryService, StockStatus } from './inventory.service';
import { InventoryFilterDto } from '../dto/inventory-filter.dto';

const STATUS_LABELS: Record<StockStatus, string> = {
  OK: 'OK',
  BELOW_REORDER: 'Bajo mínimo',
  OUT_OF_STOCK: 'Sin stock',
};

@Injectable()
export class InventoryExportService {
  private readonly logger = new Logger(InventoryExportService.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async exportStockList(tenantId: string, filters: InventoryFilterDto): Promise<Buffer> {
    const { page: _p, limit: _l, ...rest } = filters;
    const result = await this.inventoryService.findAll(tenantId, {
      ...rest,
      page: 1,
      limit: 10000,
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Inventario');

    sheet.addRow([
      'Código',
      'Descripción',
      'Categoría',
      'Stock actual',
      'Costo promedio',
      'Valor total',
      'Reorder level',
      'Último movimiento',
      'Estado',
    ]);
    sheet.getRow(1).font = { bold: true };

    for (const it of result.data) {
      sheet.addRow([
        it.code,
        it.description,
        it.categoryName ?? '',
        it.currentQty,
        it.currentAvgCost,
        it.totalValue,
        it.reorderLevel ?? '',
        it.lastMovementAt ? new Date(it.lastMovementAt) : '',
        STATUS_LABELS[it.status],
      ]);
    }

    sheet.columns.forEach((col) => { col.width = 18; });
    sheet.getColumn(4).numFmt = '#,##0.0000';
    sheet.getColumn(5).numFmt = '#,##0.0000';
    sheet.getColumn(6).numFmt = '#,##0.00';
    sheet.getColumn(7).numFmt = '#,##0.0000';
    sheet.getColumn(8).numFmt = 'yyyy-mm-dd hh:mm';

    const arr = await wb.xlsx.writeBuffer();
    return Buffer.from(arr as ArrayBuffer);
  }
}
