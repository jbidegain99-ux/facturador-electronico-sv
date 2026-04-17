import { Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  getSchemaForTipo,
  DteTipoCode,
  AnyDteParsed,
} from '../schemas/received';
import { parseMhDate } from '../../../common/utils/parse-mh-date';

// =========================================================================
// Public output types (ParsedDTE from spec §3)
// =========================================================================

export { DteTipoCode };

export interface ParsedEmisor {
  nit?: string;
  nrc?: string;
  nombre: string;
  tipoDocumento?: string;
  numDocumento?: string;
  [key: string]: unknown;
}

export interface ParsedReceptor {
  nit?: string;
  nrc?: string;
  nombre: string;
  [key: string]: unknown;
}

export interface ParsedDTE {
  tipoDte: DteTipoCode;
  version: number;
  ambiente: '00' | '01';
  numeroControl: string;
  codigoGeneracion: string;
  tipoModelo: number;
  tipoOperacion: number;
  fecEmi: string;
  horEmi: string;
  tipoMoneda: 'USD';
  emisor: ParsedEmisor;
  receptor?: ParsedReceptor;
  cuerpoDocumento?: unknown[];
  resumen?: Record<string, unknown>;
  docsAsociados?: unknown[];
  selloRecepcion?: string;
  fhProcesamiento?: Date;
  raw: string;
}

export type ParseErrorCode =
  | 'INVALID_JSON'
  | 'MISSING_FIELD'
  | 'INVALID_TIPO_DTE'
  | 'UNSUPPORTED_VERSION'
  | 'INVALID_NIT'
  | 'INVALID_UUID'
  | 'INVALID_NUMERO_CONTROL'
  | 'INVALID_DATE'
  | 'INVALID_AMOUNT'
  | 'ARITHMETIC_MISMATCH'
  | 'TYPE_SPECIFIC_VIOLATION'
  | 'EMPTY_CUERPO_DOCUMENTO'
  | 'MISSING_DOCS_ASOCIADOS';

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  path?: string;
  expected?: string | number;
  actual?: string | number;
}

export interface ParseResult {
  valid: boolean;
  data?: ParsedDTE;
  errors: ParseError[];
}

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class DteImportParserService {
  parse(jsonString: string, expectedType?: DteTipoCode): ParseResult {
    let obj: unknown;
    try {
      obj = JSON.parse(jsonString);
    } catch (err) {
      return {
        valid: false,
        errors: [
          {
            code: 'INVALID_JSON',
            message: `Could not parse JSON: ${(err as Error).message}`,
          },
        ],
      };
    }
    return this.parseObject(obj, expectedType, jsonString);
  }

  parseObject(obj: unknown, expectedType?: DteTipoCode, rawOverride?: string): ParseResult {
    const raw = rawOverride ?? JSON.stringify(obj);

    // 1. Extract tipoDte from identificacion (structural minimum)
    const identificacion = (obj as { identificacion?: { tipoDte?: string } })?.identificacion;
    if (!identificacion) {
      return {
        valid: false,
        errors: [
          {
            code: 'MISSING_FIELD',
            message: 'identificacion block is required',
            path: 'identificacion',
          },
        ],
      };
    }

    const tipoDte = identificacion.tipoDte;
    if (!tipoDte) {
      return {
        valid: false,
        errors: [
          {
            code: 'MISSING_FIELD',
            message: 'tipoDte is required',
            path: 'identificacion.tipoDte',
          },
        ],
      };
    }

    // 2. Validate tipoDte is known + matches expected
    const knownTipos: DteTipoCode[] = [
      '01', '03', '04', '05', '06', '07', '08', '09', '11', '14', '15',
    ];
    if (!knownTipos.includes(tipoDte as DteTipoCode)) {
      return {
        valid: false,
        errors: [
          {
            code: 'INVALID_TIPO_DTE',
            message: `Unknown tipoDte: ${tipoDte}`,
            actual: tipoDte,
          },
        ],
      };
    }
    if (expectedType && tipoDte !== expectedType) {
      return {
        valid: false,
        errors: [
          {
            code: 'INVALID_TIPO_DTE',
            message: `Expected tipoDte ${expectedType}, got ${tipoDte}`,
            expected: expectedType,
            actual: tipoDte,
          },
        ],
      };
    }

    // 3. Run the per-type Zod schema
    const schema = getSchemaForTipo(tipoDte as DteTipoCode);
    const parsed = schema.safeParse(obj);
    if (!parsed.success) {
      return {
        valid: false,
        errors: this.mapZodErrors(parsed.error),
      };
    }

    // 4. Normalize to flat ParsedDTE
    const normalized = this.normalize(parsed.data as AnyDteParsed, raw, tipoDte as DteTipoCode);
    return {
      valid: true,
      data: normalized,
      errors: [],
    };
  }

  private normalize(data: AnyDteParsed, raw: string, tipoDte: DteTipoCode): ParsedDTE {
    const ident = data.identificacion;
    let emisor: ParsedEmisor;

    if (tipoDte === '14') {
      const se = (data as {
        sujetoExcluido: {
          nombre: string;
          tipoDocumento: string;
          numDocumento: string;
        };
      }).sujetoExcluido;
      emisor = {
        nombre: se.nombre,
        tipoDocumento: se.tipoDocumento,
        numDocumento: se.numDocumento,
      };
    } else {
      const e = (data as {
        emisor: { nit: string; nrc?: string | null; nombre: string };
      }).emisor;
      emisor = {
        nit: e.nit,
        nrc: e.nrc ?? undefined,
        nombre: e.nombre,
      };
    }

    const receptor = (data as {
      receptor?: { nit?: string | null; nrc?: string | null; nombre: string } | null;
    }).receptor;
    const parsedReceptor: ParsedReceptor | undefined = receptor
      ? {
          nit: receptor.nit ?? undefined,
          nrc: receptor.nrc ?? undefined,
          nombre: receptor.nombre,
        }
      : undefined;

    const cuerpoDocumento = (data as { cuerpoDocumento?: unknown[] }).cuerpoDocumento;
    const resumen = (data as { resumen?: Record<string, unknown> }).resumen;
    const docsAsociados = (data as { docsAsociados?: unknown[] }).docsAsociados;

    // Optional MH metadata on the root (if DTE came with sello)
    const selloRecepcion = (data as { selloRecepcion?: string }).selloRecepcion;
    const fhProcesamiento =
      parseMhDate((data as { fhProcesamiento?: string }).fhProcesamiento) ?? undefined;

    return {
      tipoDte,
      version: ident.version,
      ambiente: ident.ambiente,
      numeroControl: ident.numeroControl,
      codigoGeneracion: ident.codigoGeneracion,
      tipoModelo: ident.tipoModelo,
      tipoOperacion: ident.tipoOperacion,
      fecEmi: ident.fecEmi,
      horEmi: ident.horEmi,
      tipoMoneda: 'USD',
      emisor,
      receptor: parsedReceptor,
      cuerpoDocumento,
      resumen,
      docsAsociados,
      selloRecepcion,
      fhProcesamiento,
      raw,
    };
  }

  private mapZodErrors(err: ZodError): ParseError[] {
    return err.errors.map((e) => {
      const pathStr = e.path.join('.');
      let code: ParseErrorCode = 'TYPE_SPECIFIC_VIOLATION';
      const msg = e.message.toLowerCase();

      if (pathStr.endsWith('nit') && (msg.includes('nit') || msg.includes('14 digit'))) {
        code = 'INVALID_NIT';
      } else if (
        pathStr.endsWith('codigoGeneracion') &&
        (msg.includes('uuid') || msg.includes('codigogeneracion'))
      ) {
        code = 'INVALID_UUID';
      } else if (pathStr.endsWith('numeroControl')) {
        code = 'INVALID_NUMERO_CONTROL';
      } else if (
        e.code === 'too_small' &&
        pathStr === 'cuerpoDocumento'
      ) {
        code = 'EMPTY_CUERPO_DOCUMENTO';
      } else if (pathStr.includes('cuerpoDocumento') && msg.includes('at least 1')) {
        code = 'EMPTY_CUERPO_DOCUMENTO';
      } else if (pathStr.includes('docsAsociados') && msg.includes('at least')) {
        code = 'MISSING_DOCS_ASOCIADOS';
      } else if (
        msg.includes('totaliva') ||
        msg.includes('ivaitem') ||
        msg.includes('within') ||
        msg.includes('must equal')
      ) {
        code = 'ARITHMETIC_MISMATCH';
      } else if (
        e.code === 'invalid_literal' ||
        (msg.includes('tipodte') && msg.includes('literal'))
      ) {
        code = 'INVALID_TIPO_DTE';
      } else if (
        e.code === 'invalid_type' &&
        (e as { received?: string }).received === 'undefined'
      ) {
        code = 'MISSING_FIELD';
      } else if (msg.includes('required')) {
        code = 'MISSING_FIELD';
      }

      return {
        code,
        message: e.message,
        path: pathStr || undefined,
      };
    });
  }
}
