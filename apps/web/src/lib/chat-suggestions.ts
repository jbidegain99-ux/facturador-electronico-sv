export interface ChatSuggestion {
  text: string;
  icon?: string;
}

interface PageSuggestions {
  pattern: string;
  suggestions: ChatSuggestion[];
}

const SUGGESTION_MAP: PageSuggestions[] = [
  {
    pattern: '/dashboard',
    suggestions: [
      { text: '¿Cuál es mi resumen del mes?', icon: '📊' },
      { text: 'Facturas vencidas', icon: '⚠️' },
      { text: '¿Cómo leer este dashboard?', icon: '❓' },
    ],
  },
  {
    pattern: '/facturacion/nueva',
    suggestions: [
      { text: '¿Qué campos son obligatorios?', icon: '📋' },
      { text: '¿Cómo agregar IVA?', icon: '💰' },
      { text: 'Guíame paso a paso', icon: '🚀' },
    ],
  },
  {
    pattern: '/facturacion/facturas',
    suggestions: [
      { text: '¿Cómo crear un CCF?', icon: '📄' },
      { text: '¿Cómo anular una factura?', icon: '❌' },
      { text: 'Diferencia entre CF y CCF', icon: '❓' },
      { text: '¿Cómo crear una Nota de Crédito?', icon: '📝' },
    ],
  },
  {
    pattern: '/cotizaciones',
    suggestions: [
      { text: '¿Cómo crear una cotización?', icon: '📋' },
      { text: '¿Cómo funciona el portal de aprobación?', icon: '✅' },
      { text: 'Convertir cotización a factura', icon: '🔄' },
    ],
  },
  {
    pattern: '/clientes',
    suggestions: [
      { text: 'Agregar nuevo cliente', icon: '👤' },
      { text: '¿Cómo importar clientes?', icon: '📥' },
      { text: 'Diferencia NIT y NRC', icon: '❓' },
    ],
  },
  {
    pattern: '/catalogo',
    suggestions: [
      { text: '¿Cómo agregar un producto?', icon: '📦' },
      { text: '¿Cómo configurar precios?', icon: '💲' },
      { text: 'Importar catálogo masivo', icon: '📥' },
    ],
  },
  {
    pattern: '/contabilidad',
    suggestions: [
      { text: '¿Qué son las partidas contables?', icon: '📚' },
      { text: '¿Cómo afecta una factura al libro diario?', icon: '📖' },
      { text: 'Exportar libro mayor', icon: '📤' },
    ],
  },
  {
    pattern: '/reportes',
    suggestions: [
      { text: '¿Cómo exportar a CSV?', icon: '📊' },
      { text: 'Reporte de IVA del mes', icon: '🧾' },
      { text: '¿Cómo filtrar por fecha?', icon: '📅' },
    ],
  },
  {
    pattern: '/configuracion',
    suggestions: [
      { text: '¿Cómo conectar con Hacienda?', icon: '🏛️' },
      { text: 'Configurar sucursales', icon: '🏢' },
      { text: '¿Cómo cambiar mi plan?', icon: '💳' },
    ],
  },
  {
    pattern: '/soporte',
    suggestions: [
      { text: 'Crear nuevo ticket', icon: '🎫' },
      { text: '¿Cuánto tarda una respuesta?', icon: '⏱️' },
      { text: 'Ver mis tickets abiertos', icon: '📋' },
    ],
  },
];

const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  { text: '¿Qué puedo hacer en Facturo?', icon: '💡' },
  { text: '¿Cómo crear una factura?', icon: '📄' },
  { text: 'Necesito ayuda', icon: '🆘' },
];

export function getSuggestionsForRoute(pathname: string): ChatSuggestion[] {
  const match = SUGGESTION_MAP.find((item) => pathname.startsWith(item.pattern));
  return match?.suggestions || DEFAULT_SUGGESTIONS;
}
