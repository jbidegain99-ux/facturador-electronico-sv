/**
 * Validador de NRC salvadoreño (Número de Registro de Contribuyente)
 *
 * Acepta:
 * - 7 dígitos: "3674750" → storage: "3674750", display: "367475-0"
 * - 8 dígitos: "03674750" → storage: "3674750" (strip leading 0), display: "367475-0"
 * - Formateado: "367475-0" → storage: "3674750", display: "367475-0"
 * - Formateado 8: "0367475-0" → storage: "3674750", display: "367475-0"
 *
 * Almacenamiento en BD: 7 dígitos sin guión (ej: "3674750")
 * Display al usuario: XXXXXX-X (ej: "367475-0")
 * Envío a Hacienda: 7 dígitos sin guión (ej: "3674750") - compatible con regex ^[0-9]{1,8}$
 */

export interface NrcValidationResult {
  /** 7 dígitos sin guión - para almacenar en BD y enviar a Hacienda */
  storage: string | null;
  /** Formato XXXXXX-X para mostrar al usuario */
  display: string | null;
  /** Mantiene compatibilidad con código existente - alias de display */
  formatted: string | null;
  isValid: boolean;
  error?: string;
}

export class NrcValidator {
  /**
   * Valida y normaliza NRC.
   * Acepta 7 u 8 dígitos (con o sin guión). Si son 8, remueve leading zero.
   */
  static validate(nrc: string | undefined | null): NrcValidationResult {
    if (!nrc) {
      return { storage: null, display: null, formatted: null, isValid: false, error: 'NRC no puede estar vacío' };
    }

    // 1. Limpiar: remover espacios, guiones, puntos
    const cleaned = nrc.trim().replace(/[-\s.]/g, '');

    // 2. Validar: solo dígitos
    if (!/^\d+$/.test(cleaned)) {
      return {
        storage: null,
        display: null,
        formatted: null,
        isValid: false,
        error: 'NRC debe contener solo dígitos (sin letras ni caracteres especiales)',
      };
    }

    // 3. Normalizar a 7 dígitos
    let digits7: string;

    if (cleaned.length === 7) {
      digits7 = cleaned;
    } else if (cleaned.length === 8) {
      // Strip leading zero to normalize to 7 digits
      if (cleaned[0] === '0') {
        digits7 = cleaned.substring(1);
      } else {
        // 8 digits without leading zero - still valid, just keep as-is for storage
        // Hacienda accepts 1-8 digits
        digits7 = cleaned;
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

    // 4. Generate display format: XXXXXX-X
    const display = `${digits7.substring(0, 6)}-${digits7.substring(6)}`;

    return {
      storage: digits7,
      display,
      formatted: display,
      isValid: true,
    };
  }

  /**
   * Extrae dígitos de un NRC (quita guiones, espacios, puntos)
   */
  static unformat(nrc: string): string {
    return nrc.replace(/[-\s.]/g, '');
  }

  /**
   * Valida que un NRC formateado sea correcto (XXXXXX-X o XXXXXXX-X)
   */
  static isFormatValid(nrc: string): boolean {
    return /^\d{6,7}-\d$/.test(nrc);
  }

  /**
   * Valida que un NRC en storage format sea correcto (7 dígitos sin guión)
   */
  static isStorageFormatValid(nrc: string): boolean {
    return /^\d{7}$/.test(nrc);
  }

  /**
   * Convierte storage (7 dígitos) → display (XXXXXX-X)
   */
  static toDisplay(storageNrc: string): string {
    const digits = storageNrc.replace(/[-\s.]/g, '');
    if (digits.length === 7) {
      return `${digits.substring(0, 6)}-${digits.substring(6)}`;
    }
    if (digits.length === 8) {
      return `${digits.substring(0, 7)}-${digits.substring(7)}`;
    }
    // Fallback: return as-is if format unknown
    return storageNrc;
  }

  /**
   * Convierte display → storage (raw digits)
   */
  static toStorage(displayNrc: string): string {
    const result = this.validate(displayNrc);
    if (!result.isValid || !result.storage) {
      throw new Error(`NRC inválido: ${displayNrc}`);
    }
    return result.storage;
  }
}
