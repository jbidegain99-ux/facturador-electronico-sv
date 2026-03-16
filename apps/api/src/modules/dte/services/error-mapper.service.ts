import { Injectable } from '@nestjs/common';

export interface ErrorContext {
  dteType?: string;
  field?: string;
  value?: string;
  expectedFormat?: string;
  mhResponse?: {
    status?: number;
    data?: Record<string, unknown>;
    message?: string;
    body?: string;
  };
  rawError: Error | string;
}

export interface MappedError {
  errorType: string;
  errorCode: string;
  userMessage: string;
  suggestedAction: string;
  resolvable: boolean;
  technicalDetails?: string;
}

@Injectable()
export class DteErrorMapperService {
  mapError(context: ErrorContext): MappedError {
    const rawMsg =
      context.rawError instanceof Error
        ? context.rawError.message
        : String(context.rawError);

    // === 1. ERRORES DE VALIDACIÓN LOCAL ===

    if (rawMsg.includes('NRC') && (rawMsg.includes('invalid') || rawMsg.includes('debe tener'))) {
      return {
        errorType: 'ValidationError',
        errorCode: 'NRC_FORMAT_INVALID',
        userMessage: `El NRC "${context.value || ''}" no es válido. Debe tener 7 u 8 dígitos. Formato esperado: XXXXXXX-X (Ej: 1234567-8)`,
        suggestedAction:
          'Verifica el NRC en el formulario del cliente. Si es una SAS con 7 dígitos, escribe solo esos 7 - Facturosv agregará el 0 automáticamente.',
        resolvable: true,
      };
    }

    if (rawMsg.includes('quantity') && rawMsg.includes('positive')) {
      return {
        errorType: 'ValidationError',
        errorCode: 'QUANTITY_INVALID',
        userMessage: 'La cantidad en el item debe ser positiva (mayor a 0).',
        suggestedAction: 'Revisa las cantidades de los items en la factura.',
        resolvable: true,
      };
    }

    if (rawMsg.includes('amount') && rawMsg.includes('positive')) {
      return {
        errorType: 'ValidationError',
        errorCode: 'AMOUNT_INVALID',
        userMessage: 'El monto debe ser positivo (mayor a $0.00).',
        suggestedAction: 'Verifica los precios unitarios y los montos de los items.',
        resolvable: true,
      };
    }

    if (rawMsg.includes('numDocumento') || rawMsg.includes('NIT') && rawMsg.includes('format')) {
      return {
        errorType: 'ValidationError',
        errorCode: 'DOCUMENT_FORMAT_INVALID',
        userMessage: 'El número de documento del receptor no tiene el formato correcto.',
        suggestedAction: 'Verifica que el NIT o DUI del cliente esté escrito correctamente.',
        resolvable: true,
      };
    }

    if (rawMsg.includes('required') || rawMsg.includes('requerido')) {
      return {
        errorType: 'ValidationError',
        errorCode: 'REQUIRED_FIELD_MISSING',
        userMessage: `Falta un campo requerido: ${context.field || 'desconocido'}.`,
        suggestedAction: 'Completa todos los campos obligatorios del formulario.',
        resolvable: true,
      };
    }

    // === 2. ERRORES DE FIRMA DIGITAL ===

    if (rawMsg.includes('No certificate loaded') || rawMsg.includes('cert') && rawMsg.includes('error')) {
      return {
        errorType: 'SigningError',
        errorCode: 'CERT_ERROR',
        userMessage: 'Error con el certificado digital. Verifica que esté válido y configurado correctamente.',
        suggestedAction: 'Ve a Configuración > Certificado Digital y carga uno válido.',
        resolvable: true,
      };
    }

    if (rawMsg.includes('SIGNING_TIMEOUT') || (rawMsg.includes('timeout') && rawMsg.includes('sign'))) {
      return {
        errorType: 'SigningError',
        errorCode: 'SIGNING_TIMEOUT',
        userMessage: 'La firma digital tardó más de lo esperado. Intenta de nuevo.',
        suggestedAction: 'Si el problema persiste, contacta a soporte@facturosv.com',
        resolvable: false,
      };
    }

    // === 3. ERRORES DE TRANSMISIÓN A HACIENDA ===

    if (rawMsg.includes('Unexpected end of JSON input')) {
      return {
        errorType: 'MhApiError',
        errorCode: 'JSON_PARSE_ERROR',
        userMessage: 'Hacienda rechazó el documento (error de formato). Revisa: NRC, fechas, y montos.',
        suggestedAction: 'Verifica que el NRC del receptor sea correcto y que todos los montos sean positivos.',
        resolvable: true,
      };
    }

    if (context.mhResponse?.status === 400) {
      const mhError = this.parseMhErrorMessage(context.mhResponse);
      return {
        errorType: 'MhApiError',
        errorCode: 'MH_VALIDATION_ERROR',
        userMessage: `Hacienda rechazó el documento: ${mhError}`,
        suggestedAction: 'Corrige los errores indicados arriba y vuelve a emitir.',
        resolvable: true,
      };
    }

    if (context.mhResponse?.status === 500 || context.mhResponse?.status === 503) {
      return {
        errorType: 'MhApiError',
        errorCode: 'MH_SERVER_ERROR',
        userMessage: 'Los servidores de Hacienda están temporalmente no disponibles. Intenta en 5 minutos.',
        suggestedAction: 'Reintenta la transmisión. Facturosv lo intentará automáticamente.',
        resolvable: false,
      };
    }

    if (context.mhResponse?.status === 401 || context.mhResponse?.status === 403) {
      return {
        errorType: 'MhApiError',
        errorCode: 'MH_AUTH_ERROR',
        userMessage: 'No hay autorización para transmitir a Hacienda. Verifica que tu credencial esté vigente.',
        suggestedAction: 'Revisa en el Ministerio de Hacienda que tu acceso a transmisión esté activo.',
        resolvable: true,
      };
    }

    // === 4. ERRORES DE RED ===

    if (rawMsg.includes('ECONNREFUSED') || rawMsg.includes('ENOTFOUND')) {
      return {
        errorType: 'NetworkError',
        errorCode: 'CONNECTION_ERROR',
        userMessage: 'No se pudo conectar a los servidores de Hacienda. Verifica tu conexión a internet.',
        suggestedAction: 'Intenta nuevamente en unos momentos.',
        resolvable: false,
      };
    }

    if (rawMsg.includes('ETIMEDOUT') || rawMsg.toLowerCase().includes('timeout')) {
      return {
        errorType: 'NetworkError',
        errorCode: 'TIMEOUT_ERROR',
        userMessage: 'La conexión tardó demasiado. Los servidores de Hacienda podrían estar lentos.',
        suggestedAction: 'Intenta nuevamente en unos minutos.',
        resolvable: false,
      };
    }

    // === 5. FALLBACK ===

    return {
      errorType: 'UnknownError',
      errorCode: 'UNKNOWN',
      userMessage: 'Ocurrió un error inesperado al emitir el documento. Contacta a soporte.',
      suggestedAction: `Reporta esto a soporte@facturosv.com con el código: ${rawMsg.substring(0, 50)}`,
      resolvable: false,
      technicalDetails: context.rawError instanceof Error ? context.rawError.stack : String(context.rawError),
    };
  }

  private parseMhErrorMessage(mhResponse: ErrorContext['mhResponse']): string {
    if (!mhResponse) return 'Error desconocido';
    if (mhResponse.data && typeof mhResponse.data === 'object') {
      const data = mhResponse.data as Record<string, unknown>;
      if (data.error) return String(data.error);
      if (data.descripcionMsg) return String(data.descripcionMsg);
    }
    if (mhResponse.message) return mhResponse.message;
    if (mhResponse.body) {
      try {
        const match = mhResponse.body.match(/<resDescription>([^<]+)<\/resDescription>/);
        if (match) return match[1];
      } catch {
        // ignore parse errors
      }
    }
    return `Error ${mhResponse.status || 'desconocido'}`;
  }
}
