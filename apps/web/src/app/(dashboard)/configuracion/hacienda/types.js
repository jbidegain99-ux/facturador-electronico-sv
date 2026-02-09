"use strict";
// Types for Hacienda Configuration
Object.defineProperty(exports, "__esModule", { value: true });
exports.TESTS_REQUIRED = exports.DTE_TYPES = void 0;
exports.DTE_TYPES = {
    '01': 'Factura',
    '03': 'Comprobante de Crédito Fiscal',
    '04': 'Nota de Remisión',
    '05': 'Nota de Crédito',
    '06': 'Nota de Débito',
    '11': 'Factura de Exportación',
    '14': 'Factura de Sujeto Excluido',
};
exports.TESTS_REQUIRED = {
    '01': { emission: 5, cancellation: 1 },
    '03': { emission: 5, cancellation: 1 },
    '04': { emission: 3, cancellation: 1 },
    '05': { emission: 2, cancellation: 1 },
    '06': { emission: 2, cancellation: 1 },
    '11': { emission: 3, cancellation: 1 },
    '14': { emission: 3, cancellation: 1 },
};
