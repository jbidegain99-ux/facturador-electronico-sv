"use strict";
/**
 * Shared test data and selectors for E2E tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMEOUTS = exports.SELECTORS = exports.ROUTES = void 0;
exports.ROUTES = {
    login: '/login',
    dashboard: '/dashboard',
    clientes: '/clientes',
    facturas: '/facturas',
    recurrentes: '/facturas/recurrentes',
    recurrentesNuevo: '/facturas/recurrentes/nuevo',
};
exports.SELECTORS = {
    // Common
    searchInput: (placeholder) => `input[placeholder*="${placeholder}"]`,
    skeleton: '.animate-pulse',
    table: 'table',
    tableRow: 'tbody tr',
    pagination: {
        next: 'button:has-text(">")',
        prev: 'button:has-text("<")',
        pageButton: (n) => `button:has-text("${n}")`,
    },
    // Login
    login: {
        email: 'input#email',
        password: 'input#password',
        submit: 'button[type="submit"]',
    },
    // Clientes
    clientes: {
        newButton: 'button:has-text("Nuevo Cliente")',
        search: 'input[placeholder*="Buscar por nombre"]',
        modalTitle: 'h2:has-text("Nuevo Cliente"), h2:has-text("Editar Cliente")',
    },
    // Facturas
    facturas: {
        newButton: 'a:has-text("Nueva Factura")',
        search: 'input[placeholder*="Buscar por numero"]',
    },
    // Recurrentes
    recurrentes: {
        newButton: 'a:has-text("Nuevo Template")',
        search: 'input[placeholder*="Buscar por nombre o cliente"]',
        tabs: {
            todas: 'button:has-text("Todas")',
            activas: 'button:has-text("Activas")',
            pausadas: 'button:has-text("Pausadas")',
            canceladas: 'button:has-text("Canceladas")',
        },
    },
    // Nuevo Template Form
    templateForm: {
        nombre: 'input[placeholder*="Mensualidad"]',
        frecuencia: 'select',
        startDate: 'input[type="date"]',
        addItem: 'button:has-text("Agregar Item")',
        submit: 'button:has-text("Crear Template")',
        cancel: 'a:has-text("Cancelar"), button:has-text("Cancelar")',
    },
};
exports.TIMEOUTS = {
    navigation: 10000,
    apiResponse: 15000,
    animation: 500,
};
