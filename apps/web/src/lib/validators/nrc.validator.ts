/**
 * Validador de NRC salvadoreño (frontend)
 *
 * Acepta 7 u 8 dígitos y normaliza a formato XXXXXXX-X
 */

export interface NrcValidationResult {
  formatted: string | null;
  isValid: boolean;
  error?: string;
}

export class NrcValidator {
  static validate(nrc: string | undefined | null): NrcValidationResult {
    if (!nrc) {
      return { formatted: null, isValid: false, error: 'NRC no puede estar vacío' };
    }

    const cleaned = nrc.trim().replace(/[-\s]/g, '');

    if (!/^\d+$/.test(cleaned)) {
      return {
        formatted: null,
        isValid: false,
        error: 'NRC debe contener solo dígitos',
      };
    }

    if (cleaned.length === 7) {
      const withZero = '0' + cleaned;
      return { formatted: `${withZero.substring(0, 7)}-${withZero.substring(7)}`, isValid: true };
    }

    if (cleaned.length === 8) {
      return { formatted: `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`, isValid: true };
    }

    return {
      formatted: null,
      isValid: false,
      error: `NRC debe tener 7 u 8 dígitos. Recibido: ${cleaned.length} dígitos`,
    };
  }

  static isFormatValid(nrc: string): boolean {
    return /^\d{7}-\d$/.test(nrc);
  }
}
