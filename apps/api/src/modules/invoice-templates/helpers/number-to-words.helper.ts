const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO',
  'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO',
  'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];

const DECENAS = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
];

const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let result = '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    result += CENTENAS[hundreds];
    if (remainder > 0) result += ' ';
  }

  if (remainder > 0) {
    if (remainder < 30) {
      result += UNIDADES[remainder];
    } else {
      const tens = Math.floor(remainder / 10);
      const units = remainder % 10;
      result += DECENAS[tens];
      if (units > 0) {
        result += ' Y ' + UNIDADES[units];
      }
    }
  }

  return result;
}

function integerToWords(n: number): string {
  if (n === 0) return 'CERO';

  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const units = n % 1000;

  let result = '';

  if (billions > 0) {
    result +=
      (billions === 1 ? 'UN BILLÓN' : convertGroup(billions) + ' BILLONES') +
      ' ';
  }

  if (millions > 0) {
    result +=
      (millions === 1 ? 'UN MILLÓN' : convertGroup(millions) + ' MILLONES') +
      ' ';
  }

  if (thousands > 0) {
    result +=
      (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
  }

  if (units > 0) {
    result += convertGroup(units);
  }

  return result.trim();
}

export function numberToWords(amount: unknown): string {
  const num = Number(amount);
  if (isNaN(num) || num < 0) return '';

  const intPart = Math.floor(num);
  const centavos = Math.round((num - intPart) * 100);

  const words = integerToWords(intPart);
  const centStr = String(centavos).padStart(2, '0');

  return `${words} DÓLARES CON ${centStr}/100`;
}
