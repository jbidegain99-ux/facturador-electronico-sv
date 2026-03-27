export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export const ALLOWED_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
] as const;

export type AllowedFont = (typeof ALLOWED_FONTS)[number];

export interface LogoSettings {
  position: 'left' | 'center' | 'right';
  maxWidth: number;
  maxHeight: number;
}

export interface SectionConfig {
  visible: boolean;
  order: number;
  content?: string;
}

export interface PageSettings {
  size: 'letter' | 'a4';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface TemplateConfig {
  colors: TemplateColors;
  fonts: TemplateFonts;
  logo: LogoSettings;
  sections: Record<string, SectionConfig>;
  pageSettings: PageSettings;
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
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  logo: {
    position: 'left',
    maxWidth: 180,
    maxHeight: 80,
  },
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

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function validateTemplateConfig(
  config: Partial<TemplateConfig>,
): string[] {
  const errors: string[] = [];

  if (config.colors) {
    for (const [key, value] of Object.entries(config.colors)) {
      if (typeof value === 'string' && !HEX_COLOR_REGEX.test(value)) {
        errors.push(`colors.${key} debe ser un color hex válido (ej: #7C3AED)`);
      }
    }
  }

  if (config.fonts) {
    const allowedSet = new Set<string>(ALLOWED_FONTS);
    if (config.fonts.heading && !allowedSet.has(config.fonts.heading)) {
      errors.push(
        `fonts.heading debe ser una de: ${ALLOWED_FONTS.join(', ')}`,
      );
    }
    if (config.fonts.body && !allowedSet.has(config.fonts.body)) {
      errors.push(`fonts.body debe ser una de: ${ALLOWED_FONTS.join(', ')}`);
    }
  }

  if (config.pageSettings?.margins) {
    const { margins } = config.pageSettings;
    for (const [key, value] of Object.entries(margins)) {
      if (typeof value === 'number' && (value < 5 || value > 50)) {
        errors.push(`pageSettings.margins.${key} debe estar entre 5 y 50 mm`);
      }
    }
  }

  if (config.logo) {
    if (
      config.logo.position &&
      !['left', 'center', 'right'].includes(config.logo.position)
    ) {
      errors.push(`logo.position debe ser 'left', 'center' o 'right'`);
    }
    if (
      config.logo.maxWidth !== undefined &&
      (config.logo.maxWidth < 50 || config.logo.maxWidth > 400)
    ) {
      errors.push(`logo.maxWidth debe estar entre 50 y 400 px`);
    }
    if (
      config.logo.maxHeight !== undefined &&
      (config.logo.maxHeight < 30 || config.logo.maxHeight > 200)
    ) {
      errors.push(`logo.maxHeight debe estar entre 30 y 200 px`);
    }
  }

  if (config.sections) {
    const orders = new Set<number>();
    for (const [key, section] of Object.entries(config.sections)) {
      if (section.order !== undefined) {
        if (orders.has(section.order)) {
          errors.push(
            `sections.${key}.order duplicado: ${section.order}`,
          );
        }
        orders.add(section.order);
      }
    }
  }

  return errors;
}
