import { Injectable, PayloadTooLargeException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReceivedDtesService, type FindAllFilters } from './received-dtes.service';

const MAX_ROWS = 10000;

@Injectable()
export class ReceivedDtesExportService {
  constructor(private readonly received: ReceivedDtesService) {}

  async exportXlsx(
    tenantId: string,
    filters: Omit<FindAllFilters, 'page' | 'limit'>,
  ): Promise<Buffer> {
    const rows = await this.received.findAllForExport(tenantId, filters);

    if (rows.length > MAX_ROWS) {
      throw new PayloadTooLargeException({ code: 'TOO_MANY', max: MAX_ROWS });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('DTEs Recibidos');

    ws.columns = [
      { header: 'Fecha emisión', key: 'fhEmision', width: 14 },
      { header: 'Tipo DTE', key: 'tipoDte', width: 10 },
      { header: 'Código generación', key: 'codigoGeneracion', width: 40 },
      { header: 'Núm. control', key: 'numeroControl', width: 30 },
      { header: 'NIT emisor', key: 'emisorNIT', width: 16 },
      { header: 'Nombre emisor', key: 'emisorNombre', width: 40 },
      { header: 'Estado', key: 'ingestStatus', width: 14 },
      { header: 'Origen', key: 'ingestSource', width: 10 },
      { header: 'Intentos MH', key: 'mhVerifyAttempts', width: 12 },
      { header: 'Última verificación', key: 'lastMhVerifyAt', width: 20 },
      { header: 'Error MH', key: 'mhVerifyError', width: 40 },
      { header: 'Errores parsing', key: 'ingestErrors', width: 40 },
      { header: 'Sello recepción', key: 'selloRecepcion', width: 40 },
      { header: 'Total gravada', key: 'totalGravada', width: 14 },
      { header: 'Total IVA', key: 'totalIva', width: 14 },
      { header: 'Total pagar', key: 'totalPagar', width: 14 },
      { header: 'Purchase ligada', key: 'purchaseNumber', width: 20 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const r of rows) {
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = r.parsedPayload ? JSON.parse(r.parsedPayload) : null;
      } catch {
        parsed = null;
      }

      // Extract totales from parsed.resumen if it exists, otherwise try top-level fields
      const resumen = (parsed?.resumen as Record<string, unknown> | undefined) ?? {};
      const totalGravada = resumen.totalGravada ?? parsed?.totalGravada ?? '';
      const totalIva = resumen.totalIva ?? parsed?.totalIva ?? '';
      const totalPagar = resumen.totalPagar ?? parsed?.totalPagar ?? '';

      ws.addRow({
        fhEmision: r.fhEmision,
        tipoDte: r.tipoDte,
        codigoGeneracion: r.codigoGeneracion,
        numeroControl: r.numeroControl,
        emisorNIT: r.emisorNIT,
        emisorNombre: r.emisorNombre,
        ingestStatus: r.ingestStatus,
        ingestSource: r.ingestSource,
        mhVerifyAttempts: r.mhVerifyAttempts,
        lastMhVerifyAt: r.lastMhVerifyAt,
        mhVerifyError: r.mhVerifyError,
        ingestErrors: r.ingestErrors,
        selloRecepcion: r.selloRecepcion,
        totalGravada,
        totalIva,
        totalPagar,
        purchaseNumber: (r as { purchase?: { purchaseNumber?: string } | null }).purchase?.purchaseNumber ?? '—',
      });
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as ArrayBuffer);
  }
}
