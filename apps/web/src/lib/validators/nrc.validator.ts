/**
 * Validador de NRC salvadoreño (frontend)
 *
 * Acepta 7 u 8 dígitos y normaliza.
 * Storage: 7 dígitos sin guión (ej: "3674750")
 * Display: XXXXXX-X (ej: "367475-0")
 */

export interface NrcValidationResult {
  /** 7 dígitos sin guión - para enviar al backend */
  storage: string | null;
  /** XXXXXX-X para mostrar al usuario */
  display: string | null;
  /** Alias de display - compatibilidad */
  formatted: string | null;
  isValid: boolean;
  error?: string;
}

export class NrcValidator {
  static validate(nrc: string | undefined | null): NrcValidationResult {
    if (!nrc) {
      return { storage: null, display: null, formatted: null, isValid: false, error: 'NRC no puede estar vacío' };
    }

    const cleaned = nrc.trim().replace(/[-\s.]/g, '');

    if (!/^\d+$/.test(cleaned)) {
      return {
        storage: null,
        display: null,
        formatted: null,
        isValid: false,
        error: 'NRC debe contener solo dígitos',
      };
    }

    let digits7: string;

    if (cleaned.length === 7) {
      digits7 = cleaned;
    } else if (cleaned.length === 8) {
      if (cleaned[0] === '0') {
        digits7 = cleaned.substring(1);
      } else {
        // 8 digits without leading zero
        const display = `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`;
        return { storage: cleaned, display, formatted: display, isValid: true };
      }
    } else {
      return {
        storage: null,
        display: null,
        formatted: null,
        isValid: false,
        error: `NRC debe tener 7 u 8 dígitos. Recibido: ${cleaned.length} dígitos`,
      };
    }

    const display = `${digits7.substring(0, 6)}-${digits7.substring(6)}`;
    return { storage: digits7, display, formatted: display, isValid: true };
  }

  static isFormatValid(nrc: string): boolean {
    return /^\d{6,7}-\d$/.test(nrc);
  }

  static toDisplay(storageNrc: string): string {
    const digits = storageNrc.replace(/[-\s.]/g, '');
    if (digits.length === 7) {
      return `${digits.substring(0, 6)}-${digits.substring(6)}`;
    }
    if (digits.length === 8) {
      return `${digits.substring(0, 7)}-${digits.substring(7)}`;
    }
    return storageNrc;
  }
}
