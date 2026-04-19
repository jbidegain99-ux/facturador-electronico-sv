import { Injectable, Logger } from '@nestjs/common';
import * as Papa from 'papaparse';

export interface CsvRow {
  rowNumber: number;
  code: string;
  countedQty: number;
  notes: string;
}

export interface CsvError {
  rowNumber: number;
  code?: string;
  reason: 'INVALID_HEADER' | 'EMPTY_CODE' | 'INVALID_QTY';
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: CsvError[];
  skipped: number;
}

const REQUIRED_COLUMNS = ['code', 'description', 'systemqty', 'countedqty', 'notes'];
const MAX_ROWS = 10000;

@Injectable()
export class PhysicalCountCsvService {
  private readonly logger = new Logger(PhysicalCountCsvService.name);

  parse(csv: string): CsvParseResult {
    const clean = csv.replace(/^\uFEFF/, '');
    const parsed = Papa.parse<Record<string, string>>(clean, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const headers = parsed.meta.fields ?? [];
    if (!REQUIRED_COLUMNS.every((c) => headers.includes(c))) {
      return {
        rows: [],
        errors: [{ rowNumber: 1, reason: 'INVALID_HEADER' }],
        skipped: 0,
      };
    }

    const rows: CsvRow[] = [];
    const errors: CsvError[] = [];
    let skipped = 0;

    parsed.data.slice(0, MAX_ROWS).forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const code = String(raw['code'] ?? '').trim().toUpperCase();
      const countedQtyStr = String(raw['countedqty'] ?? '').trim();
      const notes = String(raw['notes'] ?? '').trim();

      if (!code) {
        errors.push({ rowNumber, reason: 'EMPTY_CODE' });
        return;
      }
      if (countedQtyStr === '') {
        skipped++;
        return;
      }
      const qty = parseFloat(countedQtyStr);
      if (!Number.isFinite(qty) || qty < 0) {
        errors.push({ rowNumber, code, reason: 'INVALID_QTY' });
        return;
      }

      rows.push({ rowNumber, code, countedQty: qty, notes });
    });

    this.logger.debug(`CSV parse: ${rows.length} rows, ${errors.length} errors, ${skipped} skipped`);

    return { rows, errors, skipped };
  }
}
