export const ALLOWED_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
] as const;

export type AllowedFont = (typeof ALLOWED_FONTS)[number];

export interface SectionConfig {
  visible: boolean;
  order: number;
}

export interface TemplateConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo: {
    position: 'left' | 'center' | 'right';
    maxWidth: number;
    maxHeight: number;
  };
  sections: Record<string, SectionConfig>;
  pageSettings: {
    size: 'letter' | 'a4';
    margins: { top: number; right: number; bottom: number; left: number };
  };
}

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colors: {
    primary: '#7C3AED',
    secondary: '#4C1D95',
    accent: '#A78BFA',
    background: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  logo: { position: 'left', maxWidth: 180, maxHeight: 80 },
  sections: {
    header: { visible: true, order: 1 },
    emisor: { visible: true, order: 2 },
    receptor: { visible: true, order: 3 },
    items: { visible: true, order: 4 },
    resumen: { visible: true, order: 5 },
    observaciones: { visible: true, order: 6 },
    qrCode: { visible: true, order: 7 },
    selloRecepcion: { visible: true, order: 8 },
    footer: { visible: true, order: 9 },
  },
  pageSettings: {
    size: 'letter',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
  },
};

/** Secciones que NO se pueden ocultar (requeridas por Hacienda) */
export const REQUIRED_SECTIONS = ['header', 'items', 'resumen', 'qrCode'] as const;

/** Labels de secciones en español */
export const SECTION_LABELS: Record<string, string> = {
  header: 'Encabezado',
  emisor: 'Información del Emisor',
  receptor: 'Información del Receptor',
  items: 'Tabla de Ítems',
  resumen: 'Totales',
  observaciones: 'Observaciones',
  qrCode: 'Código QR',
  selloRecepcion: 'Sello de Recepción',
  footer: 'Pie de Página',
};

/** Labels de colores */
export const COLOR_LABELS: Record<string, string> = {
  primary: 'Color Primario',
  secondary: 'Color Secundario',
  accent: 'Color Acento',
  background: 'Fondo',
  text: 'Texto Principal',
  textLight: 'Texto Secundario',
};

export interface InvoiceTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  config: TemplateConfig;
  htmlTemplate?: string;
  cssStyles?: string;
  parentId: string | null;
  dteType: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
