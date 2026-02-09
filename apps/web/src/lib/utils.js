"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.getTipoDteName = getTipoDteName;
exports.getStatusColor = getStatusColor;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('es-SV', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(date));
}
function formatDateTime(date) {
    return new Intl.DateTimeFormat('es-SV', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
function getTipoDteName(tipo) {
    const tipos = {
        '01': 'Factura',
        '03': 'Credito Fiscal',
        '05': 'Nota de Credito',
        '06': 'Nota de Debito',
    };
    return tipos[tipo] || tipo;
}
function getStatusColor(status) {
    const colors = {
        PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        PROCESANDO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        PROCESADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        ANULADO: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        ERROR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
