"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MHReceptionError = void 0;
exports.sendDTE = sendDTE;
exports.consultarDTE = consultarDTE;
exports.anularDTE = anularDTE;
exports.sendContingencia = sendContingencia;
const config_1 = require("./config");
class MHReceptionError extends Error {
    statusCode;
    response;
    observaciones;
    constructor(message, statusCode, response, observaciones) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.observaciones = observaciones;
        this.name = 'MHReceptionError';
    }
}
exports.MHReceptionError = MHReceptionError;
/**
 * Envía un DTE firmado al Ministerio de Hacienda
 */
async function sendDTE(token, request, options = {}) {
    const { env = 'test', timeout = 30000 } = options;
    const baseUrl = (0, config_1.getBaseUrl)(env);
    const url = `${baseUrl}/fesv/recepciondte`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) {
            throw new MHReceptionError(data.descripcionMsg || `HTTP error: ${response.status}`, response.status, data, data.observaciones);
        }
        if (data.estado === 'RECHAZADO') {
            throw new MHReceptionError(data.descripcionMsg || 'DTE rechazado por el MH', response.status, data, data.observaciones);
        }
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof MHReceptionError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new MHReceptionError('Request timeout', 408);
        }
        throw new MHReceptionError(`Failed to send DTE: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Consulta el estado de un DTE por su código de generación
 */
async function consultarDTE(token, codigoGeneracion, options = {}) {
    const { env = 'test', timeout = 30000 } = options;
    const baseUrl = (0, config_1.getBaseUrl)(env);
    const url = `${baseUrl}/fesv/recepciondte/${codigoGeneracion}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok && response.status !== 404) {
            throw new MHReceptionError(`HTTP error: ${response.status}`, response.status);
        }
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof MHReceptionError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new MHReceptionError('Request timeout', 408);
        }
        throw new MHReceptionError(`Failed to query DTE: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Anula un DTE previamente emitido
 */
async function anularDTE(token, request, options = {}) {
    const { env = 'test', timeout = 30000 } = options;
    const baseUrl = (0, config_1.getBaseUrl)(env);
    const url = `${baseUrl}/fesv/anulardte`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) {
            throw new MHReceptionError(data.descripcionMsg || `HTTP error: ${response.status}`, response.status, undefined, data.observaciones);
        }
        if (data.estado === 'RECHAZADO') {
            throw new MHReceptionError(data.descripcionMsg || 'Anulación rechazada por el MH', response.status, undefined, data.observaciones);
        }
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof MHReceptionError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new MHReceptionError('Request timeout', 408);
        }
        throw new MHReceptionError(`Failed to cancel DTE: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Envía lote de DTEs en contingencia
 */
async function sendContingencia(token, documentos, options = {}) {
    const { env = 'test', timeout = 60000 } = options;
    const baseUrl = (0, config_1.getBaseUrl)(env);
    const url = `${baseUrl}/fesv/contingencia`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ambiente: env === 'prod' ? '01' : '00',
                idEnvio: Date.now(),
                version: 3,
                documentos,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) {
            throw new MHReceptionError(`HTTP error: ${response.status}`, response.status);
        }
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof MHReceptionError) {
            throw error;
        }
        throw new MHReceptionError(`Failed to send contingencia: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
