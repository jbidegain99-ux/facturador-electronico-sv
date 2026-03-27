import Handlebars from 'handlebars';
import type { TemplateConfig } from './constants';
import { SAMPLE_DTE_DATA } from './sample-data';

const DTE_TYPE_NAMES: Record<string, string> = {
  '01': 'FACTURA ELECTRÓNICA',
  '03': 'COMPROBANTE DE CRÉDITO FISCAL',
  '04': 'NOTA DE REMISIÓN',
  '05': 'NOTA DE CRÉDITO',
  '06': 'NOTA DE DÉBITO',
  '07': 'COMPROBANTE DE RETENCIÓN',
  '08': 'COMPROBANTE DE LIQUIDACIÓN',
  '09': 'DOCUMENTO CONTABLE DE LIQUIDACIÓN',
  '11': 'FACTURA DE EXPORTACIÓN',
  '14': 'FACTURA DE SUJETO EXCLUIDO',
  '15': 'COMPROBANTE DE DONACIÓN',
};

const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO',
  'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO',
  'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  let result = '';
  const h = Math.floor(n / 100), r = n % 100;
  if (h > 0) { result += CENTENAS[h]; if (r > 0) result += ' '; }
  if (r > 0) {
    if (r < 30) { result += UNIDADES[r]; }
    else { const t = Math.floor(r / 10), u = r % 10; result += DECENAS[t]; if (u > 0) result += ' Y ' + UNIDADES[u]; }
  }
  return result;
}

function intToWords(n: number): string {
  if (n === 0) return 'CERO';
  const m = Math.floor((n % 1000000000) / 1000000), t = Math.floor((n % 1000000) / 1000), u = n % 1000;
  let r = '';
  if (m > 0) r += (m === 1 ? 'UN MILLÓN' : convertGroup(m) + ' MILLONES') + ' ';
  if (t > 0) r += (t === 1 ? 'MIL' : convertGroup(t) + ' MIL') + ' ';
  if (u > 0) r += convertGroup(u);
  return r.trim();
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

let hbsInstance: typeof Handlebars | null = null;

function getHandlebars(): typeof Handlebars {
  if (hbsInstance) return hbsInstance;
  hbsInstance = Handlebars.create();

  hbsInstance.registerHelper('formatCurrency', (a: unknown) => { const n = Number(a); return isNaN(n) ? '$0.00' : currencyFormatter.format(n); });
  hbsInstance.registerHelper('formatDate', (d: unknown) => {
    if (!d) return '';
    const date = new Date(d as string);
    if (isNaN(date.getTime())) return String(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  });
  hbsInstance.registerHelper('formatTime', (t: unknown) => {
    if (!t) return '';
    if (typeof t === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
      const [h, m] = t.split(':').map(Number);
      const p = h >= 12 ? 'PM' : 'AM';
      return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
    }
    return String(t);
  });
  hbsInstance.registerHelper('dteTypeName', (c: unknown) => c ? (DTE_TYPE_NAMES[String(c)] || `DTE ${c}`) : '');
  hbsInstance.registerHelper('totalLetras', (a: unknown) => {
    const n = Number(a); if (isNaN(n) || n < 0) return '';
    const i = Math.floor(n), c = Math.round((n - i) * 100);
    return `${intToWords(i)} DÓLARES CON ${String(c).padStart(2, '0')}/100`;
  });
  hbsInstance.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  hbsInstance.registerHelper('neq', (a: unknown, b: unknown) => a !== b);
  hbsInstance.registerHelper('gt', (a: unknown, b: unknown) => Number(a) > Number(b));
  hbsInstance.registerHelper('gte', (a: unknown, b: unknown) => Number(a) >= Number(b));
  hbsInstance.registerHelper('lt', (a: unknown, b: unknown) => Number(a) < Number(b));
  hbsInstance.registerHelper('or', (...args: unknown[]) => (args.slice(0, -1) as boolean[]).some(Boolean));
  hbsInstance.registerHelper('and', (...args: unknown[]) => (args.slice(0, -1) as boolean[]).every(Boolean));
  hbsInstance.registerHelper('json', (o: unknown) => JSON.stringify(o, null, 2));
  hbsInstance.registerHelper('multiply', (a: unknown, b: unknown) => { const r = Number(a) * Number(b); return isNaN(r) ? 0 : r; });
  hbsInstance.registerHelper('add', (a: unknown, b: unknown) => { const r = Number(a) + Number(b); return isNaN(r) ? 0 : r; });
  hbsInstance.registerHelper('ifCond', function (this: unknown, v1: unknown, op: string, v2: unknown, options: Handlebars.HelperOptions) {
    const ops: Record<string, () => boolean> = {
      '===': () => v1 === v2, '!==': () => v1 !== v2,
      '>': () => Number(v1) > Number(v2), '<': () => Number(v1) < Number(v2),
      '>=': () => Number(v1) >= Number(v2), '<=': () => Number(v1) <= Number(v2),
    };
    return (ops[op]?.() ?? false) ? options.fn(this) : options.inverse(this);
  });

  return hbsInstance;
}

/**
 * Compila un template Handlebars con datos de muestra y config.
 */
export function compileTemplate(
  htmlTemplate: string,
  config: TemplateConfig,
): string {
  try {
    const hbs = getHandlebars();
    const compiled = hbs.compile(htmlTemplate);
    return compiled({ ...SAMPLE_DTE_DATA, config });
  } catch (err) {
    console.error('Error compiling template:', err);
    return `<html><body><p style="color:red;padding:20px;">Error al compilar plantilla: ${err instanceof Error ? err.message : String(err)}</p></body></html>`;
  }
}
