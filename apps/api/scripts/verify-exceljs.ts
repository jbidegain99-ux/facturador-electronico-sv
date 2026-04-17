import ExcelJS from 'exceljs';

async function verify() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  ws.addRow(['Kardex', 'column', 'test']);
  ws.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C3AED' },
  };
  console.log('[OK] exceljs import + basic API works');
}

verify();
