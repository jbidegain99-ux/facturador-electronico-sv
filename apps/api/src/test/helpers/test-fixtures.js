"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockCliente = createMockCliente;
exports.createMockDte = createMockDte;
exports.createMockTemplate = createMockTemplate;
exports.createMockHistory = createMockHistory;
exports.createMockTenant = createMockTenant;
const client_1 = require("@prisma/client");
function createMockCliente(overrides) {
    return {
        id: 'cliente-1',
        tenantId: 'tenant-1',
        tipoDocumento: '36',
        numDocumento: '06141234567890',
        nombre: 'Cliente Test',
        nrc: '123456-7',
        correo: 'cliente@test.com',
        telefono: '2222-3333',
        direccion: JSON.stringify({
            departamento: '06',
            municipio: '14',
            complemento: 'Calle Test #123',
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function createMockDte(overrides) {
    return {
        id: 'dte-1',
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        tipoDte: '01',
        codigoGeneracion: 'UUID-TEST-0001',
        numeroControl: 'DTE-01-M001P001-000000000000001',
        jsonOriginal: JSON.stringify({ identificacion: {}, emisor: {}, receptor: {} }),
        jsonFirmado: null,
        estado: 'PENDIENTE',
        selloRecepcion: null,
        fechaRecepcion: null,
        codigoMh: null,
        descripcionMh: null,
        totalGravada: new client_1.Prisma.Decimal('100.00'),
        totalIva: new client_1.Prisma.Decimal('13.00'),
        totalPagar: new client_1.Prisma.Decimal('113.00'),
        intentosEnvio: 0,
        createdAt: new Date('2025-01-15T10:00:00Z'),
        ...overrides,
    };
}
function createMockTemplate(overrides) {
    return {
        id: 'template-1',
        tenantId: 'tenant-1',
        nombre: 'Mensualidad Hosting',
        descripcion: 'Servicio mensual de hosting',
        clienteId: 'cliente-1',
        tipoDte: '01',
        interval: 'MONTHLY',
        anchorDay: 1,
        dayOfWeek: null,
        mode: 'AUTO_DRAFT',
        autoTransmit: false,
        items: JSON.stringify([
            { descripcion: 'Hosting Web', cantidad: 1, precioUnitario: 50, descuento: 0 },
        ]),
        notas: null,
        status: 'ACTIVE',
        consecutiveFailures: 0,
        lastError: null,
        nextRunDate: new Date('2025-02-01T01:00:00Z'),
        lastRunDate: null,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: null,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z'),
        ...overrides,
    };
}
function createMockHistory(overrides) {
    return {
        id: 'history-1',
        templateId: 'template-1',
        dteId: 'dte-1',
        status: 'SUCCESS',
        error: null,
        runDate: new Date('2025-01-15T01:00:00Z'),
        createdAt: new Date('2025-01-15T01:00:00Z'),
        ...overrides,
    };
}
function createMockTenant(overrides) {
    return {
        id: 'tenant-1',
        nombre: 'Empresa Test S.A. de C.V.',
        nit: '0614-010180-101-0',
        nrc: '123456-7',
        actividadEcon: '62010',
        direccion: JSON.stringify({
            departamento: '06',
            municipio: '14',
            complemento: 'Col. Escalon, Calle 1',
        }),
        telefono: '2222-3333',
        correo: 'empresa@test.com',
        nombreComercial: 'EmpresaTest',
        plan: 'PROFESIONAL',
        ...overrides,
    };
}
