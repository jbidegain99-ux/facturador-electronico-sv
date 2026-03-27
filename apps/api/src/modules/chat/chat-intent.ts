export type DataIntent =
  | 'INVOICE_COUNT'
  | 'OVERDUE_INVOICES'
  | 'REVENUE_SUMMARY'
  | 'CLIENT_COUNT'
  | 'TOP_PRODUCTS'
  | 'MONTHLY_SUMMARY'
  | 'QUOTE_STATUS'
  | 'DTE_BREAKDOWN';

export interface ClassifiedIntent {
  intent: DataIntent;
  timeRange: {
    from: Date;
    to: Date;
  };
}

interface IntentRule {
  intent: DataIntent;
  keywords: string[][];
}

// Rules ordered by specificity (most keywords first)
const INTENT_RULES: IntentRule[] = [
  {
    intent: 'MONTHLY_SUMMARY',
    keywords: [
      ['resumen', 'mes'],
      ['resumen', 'mensual'],
      ['como', 'voy', 'mes'],
      ['estado', 'mes'],
      ['como', 'va', 'negocio'],
      ['resumen', 'general'],
    ],
  },
  {
    intent: 'DTE_BREAKDOWN',
    keywords: [
      ['desglose', 'dte'],
      ['tipos', 'dte'],
      ['cuantos', 'ccf'],
      ['cuantas', 'facturas', 'consumidor'],
      ['desglose', 'tipo'],
      ['cuantos', 'credito', 'fiscal'],
      ['cuantas', 'notas', 'credito'],
    ],
  },
  {
    intent: 'OVERDUE_INVOICES',
    keywords: [
      ['facturas', 'vencidas'],
      ['pendientes', 'pago'],
      ['facturas', 'sin', 'pagar'],
      ['morosos'],
      ['cuentas', 'cobrar'],
      ['por', 'cobrar'],
    ],
  },
  {
    intent: 'INVOICE_COUNT',
    keywords: [
      ['cuantas', 'facturas'],
      ['numero', 'facturas'],
      ['facturas', 'emitidas'],
      ['facturas', 'mes'],
      ['total', 'facturas'],
      ['cantidad', 'facturas'],
      ['cuantos', 'documentos'],
    ],
  },
  {
    intent: 'REVENUE_SUMMARY',
    keywords: [
      ['cuanto', 'facture'],
      ['total', 'facturado'],
      ['ingresos'],
      ['ventas', 'totales'],
      ['revenue'],
      ['cuanto', 'vendi'],
      ['monto', 'facturado'],
      ['total', 'ventas'],
    ],
  },
  {
    intent: 'TOP_PRODUCTS',
    keywords: [
      ['producto', 'mas', 'vendido'],
      ['servicio', 'mas', 'vendido'],
      ['mas', 'vendido'],
      ['top', 'productos'],
      ['productos', 'populares'],
      ['mas', 'vendidos'],
    ],
  },
  {
    intent: 'QUOTE_STATUS',
    keywords: [
      ['cotizaciones', 'pendientes'],
      ['estado', 'cotizaciones'],
      ['cotizaciones', 'aprobadas'],
      ['cotizaciones', 'rechazadas'],
      ['cuantas', 'cotizaciones'],
      ['como', 'van', 'cotizaciones'],
      ['como', 'estan', 'cotizaciones'],
    ],
  },
  {
    intent: 'CLIENT_COUNT',
    keywords: [
      ['cuantos', 'clientes'],
      ['clientes', 'registrados'],
      ['numero', 'clientes'],
      ['total', 'clientes'],
      ['cantidad', 'clientes'],
    ],
  },
];

/**
 * Normalize text: lowercase, strip accents, remove punctuation
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[¿?¡!.,;:()]/g, '')   // strip punctuation
    .trim();
}

/**
 * Extract time range from message text.
 * Returns { from, to } dates based on temporal keywords.
 * Default: current month.
 */
function extractTimeRange(normalized: string): { from: Date; to: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // "ultimos 3 meses" / "ultimo trimestre"
  if (
    normalized.includes('ultimos 3 meses') ||
    normalized.includes('ultimo trimestre') ||
    normalized.includes('trimestre')
  ) {
    const from = new Date(year, month - 2, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }

  // "este ano" / "del ano"
  if (normalized.includes('este ano') || normalized.includes('del ano')) {
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }

  // "mes pasado" / "mes anterior"
  if (normalized.includes('mes pasado') || normalized.includes('mes anterior')) {
    return {
      from: new Date(year, month - 1, 1),
      to: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  // Named months (Spanish)
  const monthNames: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3,
    mayo: 4, junio: 5, julio: 6, agosto: 7,
    septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  for (const [name, idx] of Object.entries(monthNames)) {
    if (normalized.includes(name)) {
      // Check for year mention like "enero 2025"
      const yearMatch = normalized.match(new RegExp(`${name}\\s*(\\d{4})`));
      const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : year;
      return {
        from: new Date(targetYear, idx, 1),
        to: new Date(targetYear, idx + 1, 0, 23, 59, 59, 999),
      };
    }
  }

  // Default: current month
  return {
    from: new Date(year, month, 1),
    to: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

/**
 * Classify user message into a data intent.
 * Returns null if no data intent is detected (question goes to Denis without context).
 */
export function classifyIntent(message: string): ClassifiedIntent | null {
  const normalized = normalize(message);

  for (const rule of INTENT_RULES) {
    for (const keywordGroup of rule.keywords) {
      const allMatch = keywordGroup.every((kw) => normalized.includes(kw));
      if (allMatch) {
        return {
          intent: rule.intent,
          timeRange: extractTimeRange(normalized),
        };
      }
    }
  }

  return null;
}
