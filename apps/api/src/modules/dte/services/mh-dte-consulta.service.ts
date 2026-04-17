import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { HACIENDA_URLS, HACIENDA_ENDPOINTS } from '../../hacienda/interfaces';
import { parseMhDate } from '../../../common/utils/parse-mh-date';

export type MhVerifyStatus =
  | 'VERIFIED'
  | 'HARD_FAIL_NOT_FOUND'
  | 'HARD_FAIL_MISMATCH'
  | 'RETRY_TIMEOUT'
  | 'RETRY_5XX'
  | 'RETRY_AUTH'
  | 'UNKNOWN_ERROR';

export interface MhVerifyResult {
  status: MhVerifyStatus;
  httpStatus?: number;
  mhSelloRecepcion?: string;
  mhFhProcesamiento?: Date;
  mhEstado?: string;
  errorMessage?: string;
  durationMs: number;
}

export interface ConsultaParams {
  codigoGeneracion: string;
  ambiente: '00' | '01';
  mhToken: string;
  timeoutMs?: number;
}

@Injectable()
export class MhDteConsultaService {
  constructor(private readonly http: HttpService) {}

  async verify(params: ConsultaParams): Promise<MhVerifyResult> {
    const startedAt = Date.now();
    const baseUrl = params.ambiente === '01' ? HACIENDA_URLS.PRODUCTION : HACIENDA_URLS.TEST;
    const url = `${baseUrl}${HACIENDA_ENDPOINTS.CONSULTA_DTE}`;
    const timeoutMs = params.timeoutMs ?? 5000;

    try {
      const response = await firstValueFrom(
        this.http.post<unknown>(
          url,
          {
            codigoGeneracion: params.codigoGeneracion,
            ambiente: params.ambiente,
          },
          {
            headers: {
              // NO "Bearer " prefix (CLAUDE.md rule)
              Authorization: params.mhToken,
              'Content-Type': 'application/json',
            },
            timeout: timeoutMs,
            // Read as text first (per CLAUDE.md), parse JSON after
            transformResponse: [(raw: string) => raw],
          },
        ),
      );
      return this.mapSuccess(response, startedAt);
    } catch (err) {
      return this.mapError(err as AxiosError, startedAt);
    }
  }

  private mapSuccess(response: AxiosResponse<unknown>, startedAt: number): MhVerifyResult {
    const durationMs = Date.now() - startedAt;
    const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    let body: { estado?: string; selloRecepcion?: string; fhProcesamiento?: string };
    try {
      body = raw ? (JSON.parse(raw) as typeof body) : {};
    } catch {
      return {
        status: 'UNKNOWN_ERROR',
        httpStatus: response.status,
        errorMessage: 'Could not parse MH response body as JSON',
        durationMs,
      };
    }

    if (body.estado === 'PROCESADO' && body.selloRecepcion) {
      return {
        status: 'VERIFIED',
        httpStatus: response.status,
        mhEstado: body.estado,
        mhSelloRecepcion: body.selloRecepcion,
        mhFhProcesamiento: parseMhDate(body.fhProcesamiento) ?? undefined,
        durationMs,
      };
    }

    if (body.estado === 'RECHAZADO' || !body.selloRecepcion) {
      return {
        status: 'HARD_FAIL_MISMATCH',
        httpStatus: response.status,
        mhEstado: body.estado,
        errorMessage: `MH returned estado=${body.estado}`,
        durationMs,
      };
    }

    return {
      status: 'UNKNOWN_ERROR',
      httpStatus: response.status,
      errorMessage: `Unexpected MH response: ${raw.slice(0, 200)}`,
      durationMs,
    };
  }

  private mapError(err: AxiosError, startedAt: number): MhVerifyResult {
    const durationMs = Date.now() - startedAt;

    // Timeout / connection aborted
    if (
      err.code === 'ECONNABORTED' ||
      err.code === 'ETIMEDOUT' ||
      err.message.toLowerCase().includes('timeout')
    ) {
      return {
        status: 'RETRY_TIMEOUT',
        errorMessage: err.message,
        durationMs,
      };
    }

    if (!err.response) {
      return {
        status: 'UNKNOWN_ERROR',
        errorMessage: err.message,
        durationMs,
      };
    }

    const status = err.response.status;
    if (status === 404) {
      return { status: 'HARD_FAIL_NOT_FOUND', httpStatus: status, durationMs };
    }
    if (status === 400) {
      // MH sometimes returns 400 with "no existe"
      const raw =
        typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data);
      if (raw.toLowerCase().includes('no existe') || raw.toLowerCase().includes('not found')) {
        return { status: 'HARD_FAIL_NOT_FOUND', httpStatus: status, durationMs };
      }
      return { status: 'UNKNOWN_ERROR', httpStatus: status, errorMessage: raw, durationMs };
    }
    if (status === 401 || status === 403) {
      return { status: 'RETRY_AUTH', httpStatus: status, durationMs };
    }
    if (status === 408) {
      return { status: 'RETRY_TIMEOUT', httpStatus: status, durationMs };
    }
    if (status >= 500 && status < 600) {
      return { status: 'RETRY_5XX', httpStatus: status, durationMs };
    }
    return {
      status: 'UNKNOWN_ERROR',
      httpStatus: status,
      errorMessage: err.message,
      durationMs,
    };
  }
}
