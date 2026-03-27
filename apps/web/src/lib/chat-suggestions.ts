export interface ChatSuggestion {
  text: string;
  icon?: string; // Lucide icon name key
}

interface PageSuggestions {
  pattern: string;
  suggestions: ChatSuggestion[];
}

const SUGGESTION_MAP: PageSuggestions[] = [
  {
    pattern: '/dashboard',
    suggestions: [
      { text: '¿Cuál es mi resumen del mes?', icon: 'bar-chart-3' },
      { text: 'Comparar con el mes anterior', icon: 'arrow-left-right' },
      { text: 'Proyección de ventas', icon: 'trending-up' },
      { text: 'Facturas vencidas', icon: 'alert-triangle' },
    ],
  },
  {
    pattern: '/facturacion/nueva',
    suggestions: [
      { text: '¿Qué campos son obligatorios?', icon: 'clipboard-list' },
      { text: '¿Cómo agregar IVA?', icon: 'calculator' },
      { text: 'Guíame paso a paso', icon: 'footprints' },
    ],
  },
  {
    pattern: '/facturacion/facturas',
    suggestions: [
      { text: 'Últimas 5 facturas', icon: 'file-text' },
      { text: 'Total de IVA del mes', icon: 'receipt' },
      { text: '¿Cómo anular una factura?', icon: 'x-circle' },
      { text: 'Facturas de hoy', icon: 'calendar' },
    ],
  },
  {
    pattern: '/cotizaciones',
    suggestions: [
      { text: '¿Cómo crear una cotización?', icon: 'clipboard-list' },
      { text: '¿Cómo funciona el portal de aprobación?', icon: 'check-circle' },
      { text: 'Convertir cotización a factura', icon: 'arrow-right-left' },
    ],
  },
  {
    pattern: '/clientes',
    suggestions: [
      { text: '¿A quién le facturo más?', icon: 'crown' },
      { text: 'Clientes nuevos del mes', icon: 'user-plus' },
      { text: 'Agregar nuevo cliente', icon: 'user' },
      { text: '¿Cómo importar clientes?', icon: 'download' },
    ],
  },
  {
    pattern: '/catalogo',
    suggestions: [
      { text: '¿Cómo agregar un producto?', icon: 'package' },
      { text: '¿Cuáles son mis productos más vendidos?', icon: 'trophy' },
      { text: 'Importar catálogo masivo', icon: 'download' },
    ],
  },
  {
    pattern: '/contabilidad',
    suggestions: [
      { text: '¿Qué son las partidas contables?', icon: 'book-open' },
      { text: '¿Cómo afecta una factura al libro diario?', icon: 'book' },
      { text: 'Exportar libro mayor', icon: 'upload' },
    ],
  },
  {
    pattern: '/reportes',
    suggestions: [
      { text: 'Proyección de ventas', icon: 'trending-up' },
      { text: 'Ventas por sucursal', icon: 'building-2' },
      { text: 'Reporte de IVA del mes', icon: 'receipt' },
      { text: '¿Cómo exportar a CSV?', icon: 'bar-chart-3' },
    ],
  },
  {
    pattern: '/configuracion',
    suggestions: [
      { text: '¿Cómo conectar con Hacienda?', icon: 'landmark' },
      { text: 'Configurar sucursales', icon: 'building-2' },
      { text: '¿Cuánto de mi plan he usado?', icon: 'bar-chart-3' },
    ],
  },
  {
    pattern: '/soporte',
    suggestions: [
      { text: 'Crear nuevo ticket', icon: 'ticket' },
      { text: '¿Cuánto tarda una respuesta?', icon: 'clock' },
      { text: 'Ver mis tickets abiertos', icon: 'clipboard-list' },
    ],
  },
];

const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  { text: '¿Qué puedo hacer en Facturo?', icon: 'lightbulb' },
  { text: '¿Cómo crear una factura?', icon: 'file-text' },
  { text: 'Necesito ayuda', icon: 'life-buoy' },
];

export function getSuggestionsForRoute(pathname: string): ChatSuggestion[] {
  const match = SUGGESTION_MAP.find((item) => pathname.startsWith(item.pattern));
  return match?.suggestions || DEFAULT_SUGGESTIONS;
}
