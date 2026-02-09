"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MH_ENDPOINTS = exports.DEPARTAMENTOS = exports.TRIBUTO = exports.TIPO_ITEM = exports.CONDICION_OPERACION = exports.TIPO_DOCUMENTO_RECEPTOR = exports.AMBIENTE = exports.TIPO_DTE = void 0;
exports.TIPO_DTE = {
    FACTURA: '01',
    CCF: '03',
    NOTA_CREDITO: '05',
    NOTA_DEBITO: '06',
};
exports.AMBIENTE = {
    PRUEBAS: '00',
    PRODUCCION: '01',
};
exports.TIPO_DOCUMENTO_RECEPTOR = {
    NIT: '36',
    DUI: '13',
    CARNET_RESIDENTE: '02',
    PASAPORTE: '03',
    OTRO: '37',
};
exports.CONDICION_OPERACION = {
    CONTADO: 1,
    CREDITO: 2,
    OTRO: 3,
};
exports.TIPO_ITEM = {
    BIENES: 1,
    SERVICIOS: 2,
    AMBOS: 3,
    IMPUESTO: 4,
};
exports.TRIBUTO = {
    IVA: '20',
};
exports.DEPARTAMENTOS = {
    '01': 'Ahuachapan',
    '02': 'Santa Ana',
    '03': 'Sonsonate',
    '04': 'Chalatenango',
    '05': 'La Libertad',
    '06': 'San Salvador',
    '07': 'Cuscatlan',
    '08': 'La Paz',
    '09': 'Cabanas',
    '10': 'San Vicente',
    '11': 'Usulutan',
    '12': 'San Miguel',
    '13': 'Morazan',
    '14': 'La Union',
};
exports.MH_ENDPOINTS = {
    AUTH: '/seguridad/auth',
    RECEPCION_DTE: '/fesv/recepciondte',
    CONSULTA_DTE: '/fesv/consultadte',
    ANULAR_DTE: '/fesv/anulardte',
    CONTINGENCIA: '/fesv/contingencia',
};
