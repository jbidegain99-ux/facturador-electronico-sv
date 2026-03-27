export type DataIntent =
  | 'INVOICE_COUNT'
  | 'OVERDUE_INVOICES'
  | 'REVENUE_SUMMARY'
  | 'CLIENT_COUNT'
  | 'TOP_PRODUCTS'
  | 'MONTHLY_SUMMARY'
  | 'QUOTE_STATUS'
  | 'DTE_BREAKDOWN'
  // Phase 2B intents
  | 'TOP_CLIENTS'
  | 'MONTH_COMPARISON'
  | 'CLIENT_INVOICES'
  | 'NEW_CLIENTS'
  | 'RECENT_INVOICES_TODAY'
  | 'LATEST_INVOICES'
  | 'CLIENT_PRODUCTS'
  | 'TAX_SUMMARY'
  | 'CLIENT_QUOTES'
  | 'BRANCH_BREAKDOWN'
  | 'SALES_PROJECTION'
  // Schema-derived bonus intents
  | 'PLAN_USAGE'
  | 'RECURRING_TEMPLATES'
  | 'HACIENDA_REJECTIONS';

export interface ClassifiedIntent {
  intent: DataIntent;
  timeRange: {
    from: Date;
    to: Date;
  };
  params?: {
    clientName?: string;
  };
}

interface IntentRule {
  intent: DataIntent;
  keywords: string[][];
  extractClient?: boolean;
}

// Rules ordered by specificity (most keywords first)
const INTENT_RULES: IntentRule[] = [
  // --- Phase 2B: New intents (more specific first) ---
  {
    intent: 'MONTH_COMPARISON',
    keywords: [
      ['comparar', 'meses'],
      ['comparar', 'mes'],
      ['este', 'mes', 'vs'],
      ['mes', 'anterior', 'vs'],
      ['comparacion', 'mes'],
      ['como', 'fue', 'comparado'],
      ['diferencia', 'entre', 'meses'],
      ['versus', 'mes'],
    ],
  },
  {
    intent: 'SALES_PROJECTION',
    keywords: [
      ['proyeccion', 'ventas'],
      ['proyeccion', 'factur'],
      ['proyeccion'],
      ['tendencia', 'ventas'],
      ['a', 'este', 'ritmo'],
      ['cuanto', 'voy', 'facturar'],
      ['estimacion', 'ventas'],
      ['forecast'],
    ],
  },
  {
    intent: 'CLIENT_PRODUCTS',
    keywords: [
      ['productos', 'de'],
      ['servicios', 'de'],
      ['que', 'le', 'vendo', 'a'],
      ['que', 'productos', 'compra'],
      ['que', 'servicios', 'compra'],
    ],
    extractClient: true,
  },
  {
    intent: 'CLIENT_QUOTES',
    keywords: [
      ['cotizaciones', 'de'],
      ['cotizaciones', 'para'],
      ['cuantas', 'cotizaciones', 'tiene'],
    ],
    extractClient: true,
  },
  {
    intent: 'CLIENT_INVOICES',
    keywords: [
      ['facturas', 'de'],
      ['cuanto', 'le', 'facture', 'a'],
      ['facturacion', 'de', 'cliente'],
      ['facturado', 'a'],
      ['cuanto', 'facture', 'a'],
    ],
    extractClient: true,
  },
  {
    intent: 'TOP_CLIENTS',
    keywords: [
      ['cliente', 'mas', 'factur'],
      ['mejores', 'clientes'],
      ['top', 'clientes'],
      ['quien', 'le', 'facturo', 'mas'],
      ['principales', 'clientes'],
      ['clientes', 'top'],
    ],
  },
  {
    intent: 'BRANCH_BREAKDOWN',
    keywords: [
      ['facturas', 'por', 'sucursal'],
      ['por', 'establecimiento'],
      ['desglose', 'sucursal'],
      ['ventas', 'por', 'sucursal'],
      ['por', 'punto', 'venta'],
    ],
  },
  {
    intent: 'TAX_SUMMARY',
    keywords: [
      ['total', 'iva'],
      ['iva', 'del', 'mes'],
      ['impuestos', 'mes'],
      ['iva', 'facturado'],
      ['resumen', 'iva'],
      ['cuanto', 'iva'],
      ['cuanto', 'de', 'iva'],
    ],
  },
  {
    intent: 'RECENT_INVOICES_TODAY',
    keywords: [
      ['facturas', 'de', 'hoy'],
      ['emiti', 'hoy'],
      ['facture', 'hoy'],
      ['facturas', 'esta', 'semana'],
      ['facture', 'esta', 'semana'],
      ['documentos', 'hoy'],
    ],
  },
  {
    intent: 'LATEST_INVOICES',
    keywords: [
      ['ultimas', 'facturas'],
      ['facturas', 'recientes'],
      ['ultimas', '5'],
      ['ultimas', 'emitidas'],
      ['facturas', 'mas', 'recientes'],
      ['ultimos', 'documentos'],
    ],
  },
  {
    intent: 'NEW_CLIENTS',
    keywords: [
      ['clientes', 'nuevos'],
      ['nuevos', 'clientes'],
      ['cuantos', 'clientes', 'nuevos'],
      ['clientes', 'registre'],
    ],
  },
  {
    intent: 'HACIENDA_REJECTIONS',
    keywords: [
      ['rechazadas', 'hacienda'],
      ['rechazos', 'hacienda'],
      ['facturas', 'rechazadas'],
      ['errores', 'hacienda'],
      ['documentos', 'rechazados'],
    ],
  },
  {
    intent: 'RECURRING_TEMPLATES',
    keywords: [
      ['facturas', 'recurrentes'],
      ['recurrentes', 'activas'],
      ['plantillas', 'recurrentes'],
      ['cuantas', 'recurrentes'],
    ],
  },
  {
    intent: 'PLAN_USAGE',
    keywords: [
      ['uso', 'plan'],
      ['cuanto', 'plan', 'usado'],
      ['limite', 'plan'],
      ['cuantas', 'facturas', 'quedan'],
      ['disponibles', 'plan'],
      ['mi', 'plan'],
    ],
  },
  // --- Original intents ---
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
 * Extract client name from message for client-specific intents.
 * Looks for patterns like "a Wellnest", "de IBEX", "para The Wellnest"
 */
function extractClientName(normalized: string, original: string): string | undefined {
  // Use original (non-normalized) to preserve casing of client name
  const originalLower = original.toLowerCase();

  // Patterns: "a [name]", "de [name]", "para [name]", "compra [name]"
  const patterns = [
    /(?:facture\s+a|facturado\s+a|le\s+facture\s+a|vendo\s+a|compra)\s+(.+?)$/i,
    /(?:facturas|facturacion|cotizaciones|productos|servicios)\s+(?:de|para)\s+(.+?)$/i,
    /(?:cuantas?\s+cotizaciones?\s+tiene)\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match?.[1]) {
      // Clean up trailing question marks, periods etc.
      return match[1].replace(/[¿?¡!.,;:]+$/g, '').trim();
    }
  }

  // Fallback: look for capitalized words that aren't common Spanish words
  const commonWords = new Set([
    'a', 'de', 'para', 'el', 'la', 'los', 'las', 'del', 'al', 'en', 'con',
    'por', 'que', 'como', 'cuanto', 'cuantas', 'cuantos', 'este', 'esta',
    'mes', 'facturas', 'facture', 'productos', 'servicios', 'cotizaciones',
    'le', 'vendo', 'compra', 'tiene', 'facturacion', 'facturado',
  ]);

  const words = original.split(/\s+/);
  const capitalizedSegments: string[] = [];
  let collecting = false;

  for (const word of words) {
    const cleaned = word.replace(/[¿?¡!.,;:]+/g, '');
    if (
      cleaned.length > 0 &&
      cleaned[0] === cleaned[0].toUpperCase() &&
      cleaned[0] !== cleaned[0].toLowerCase() &&
      !commonWords.has(cleaned.toLowerCase())
    ) {
      capitalizedSegments.push(cleaned);
      collecting = true;
    } else if (collecting) {
      // Stop collecting on non-capitalized word
      break;
    }
  }

  if (capitalizedSegments.length > 0) {
    return capitalizedSegments.join(' ');
  }

  return undefined;
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

  // "hoy"
  if (normalized.includes('hoy')) {
    const startOfDay = new Date(year, month, now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(year, month, now.getDate(), 23, 59, 59, 999);
    return { from: startOfDay, to: endOfDay };
  }

  // "esta semana"
  if (normalized.includes('esta semana')) {
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(year, month, now.getDate() + mondayOffset, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return { from: monday, to: sunday };
  }

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
        const result: ClassifiedIntent = {
          intent: rule.intent,
          timeRange: extractTimeRange(normalized),
        };

        if (rule.extractClient) {
          const clientName = extractClientName(normalized, message);
          if (clientName) {
            result.params = { clientName };
          }
        }

        return result;
      }
    }
  }

  return null;
}
