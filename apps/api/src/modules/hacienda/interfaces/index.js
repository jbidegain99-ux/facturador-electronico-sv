"use strict";
// ============================================================================
// HACIENDA CONFIGURATION INTERFACES
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_VALIDITY = exports.HACIENDA_ENDPOINTS = exports.HACIENDA_URLS = exports.TESTS_REQUIRED = exports.DTE_TYPES = void 0;
// DTE Types and their codes
exports.DTE_TYPES = {
    '01': 'Factura',
    '03': 'Comprobante de Crédito Fiscal',
    '04': 'Nota de Remisión',
    '05': 'Nota de Crédito',
    '06': 'Nota de Débito',
    '11': 'Factura de Exportación',
    '14': 'Factura de Sujeto Excluido',
};
// Minimum tests required by Hacienda per DTE type
exports.TESTS_REQUIRED = {
    '01': { emission: 5, cancellation: 1 },
    '03': { emission: 5, cancellation: 1 },
    '04': { emission: 3, cancellation: 1 },
    '05': { emission: 2, cancellation: 1 },
    '06': { emission: 2, cancellation: 1 },
    '11': { emission: 3, cancellation: 1 },
    '14': { emission: 3, cancellation: 1 },
};
// Hacienda API URLs
exports.HACIENDA_URLS = {
    TEST: 'https://apitest.dtes.mh.gob.sv',
    PRODUCTION: 'https://api.dtes.mh.gob.sv',
};
exports.HACIENDA_ENDPOINTS = {
    AUTH: '/seguridad/auth',
    RECEPCION_DTE: '/fesv/recepciondte',
    RECEPCION_LOTE: '/fesv/recepcionlote',
    CONTINGENCIA: '/fesv/contingencia',
    ANULAR_DTE: '/fesv/anulardte',
    CONSULTA_DTE: '/fesv/recepcion/consultadte/',
};
// Token validity
exports.TOKEN_VALIDITY = {
    TEST: 48 * 60 * 60 * 1000, // 48 hours in ms
    PRODUCTION: 24 * 60 * 60 * 1000, // 24 hours in ms
};
