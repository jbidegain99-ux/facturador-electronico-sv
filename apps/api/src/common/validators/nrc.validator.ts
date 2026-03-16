/**
 * Validador de NRC salvadoreño
 *
 * Acepta:
 * - 8 dígitos: "06231507" → "0623-150725-104-1" (con máscara apropiada)
 * - 7 dígitos: "6231507" → "06231507" (agrega 0 al inicio) → con máscara
 *
 * Formato estándar NRC: XXXXXXX-X (7 dígitos + guion + dígito verificador)
 * Ejemplo: 1234567-8
 */

export interface NrcValidationResult {
  formatted: string | null;
  isValid: boolean;
  error?: string;
}

export class NrcValidator {
  /**
   * Valida y formatea NRC
   * @param nrc Input del usuario (puede ser: "1234567-8", "12345678", "234567-8", "2345678")
   * @returns Resultado con formato normalizado
   */
  static validate(nrc: string | undefined | null): NrcValidationResult {
    if (!nrc) {
      return { formatted: null, isValid: false, error: 'NRC no puede estar vacío' };
    }

    // 1. Limpiar: remover espacios, guiones
    const cleaned = nrc.trim().replace(/[-\s]/g, '');

    // 2. Validar: solo dígitos
    if (!/^\d+$/.test(cleaned)) {
      return {
        formatted: null,
        isValid: false,
        error: 'NRC debe contener solo dígitos (sin letras ni caracteres especiales)',
      };
    }

    // 3. Validar longitud: 7 u 8 dígitos
    if (cleaned.length === 7) {
      // Agregar 0 al inicio para normalizar a 8 dígitos
      const withZero = '0' + cleaned;
      const formatted = this.applyMask(withZero);
      return { formatted, isValid: true };
    }

    if (cleaned.length === 8) {
      const formatted = this.applyMask(cleaned);
      return { formatted, isValid: true };
    }

    return {
      formatted: null,
      isValid: false,
      error: `NRC debe tener 7 u 8 dígitos. Recibido: ${cleaned.length} dígitos`,
    };
  }

  /**
   * Aplica máscara: 8 dígitos → "XXXXXXX-X"
   * Ej: "12345678" → "1234567-8"
   */
  private static applyMask(digits: string): string {
    if (digits.length !== 8) {
      throw new Error(`applyMask espera exactamente 8 dígitos, recibió ${digits.length}`);
    }
    return `${digits.substring(0, 7)}-${digits.substring(7)}`;
  }

  /**
   * Extrae dígitos de un NRC formateado
   * Ej: "1234567-8" → "12345678"
   */
  static unformat(nrc: string): string {
    return nrc.replace(/[-\s]/g, '');
  }

  /**
   * Valida que un NRC ya formateado sea correcto
   */
  static isFormatValid(nrc: string): boolean {
    return /^\d{7}-\d$/.test(nrc);
  }
}
