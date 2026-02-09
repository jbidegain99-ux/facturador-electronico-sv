"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateMH = authenticateMH;
exports.getDTEs = getDTEs;
exports.getDTE = getDTE;
exports.getDTEJson = getDTEJson;
exports.getDTELogs = getDTELogs;
exports.createAndSendDTE = createAndSendDTE;
exports.anularDTE = anularDTE;
exports.getDTEStatus = getDTEStatus;
exports.getDashboardMetrics = getDashboardMetrics;
exports.getDepartamentos = getDepartamentos;
exports.getMunicipios = getMunicipios;
exports.getActividadesEconomicas = getActividadesEconomicas;
exports.getClientes = getClientes;
exports.getCliente = getCliente;
exports.createCliente = createCliente;
exports.updateCliente = updateCliente;
exports.deleteCliente = deleteCliente;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
async function fetchAPI(endpoint, options) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de red' }));
        throw new Error(error.message || error.error || `HTTP error ${response.status}`);
    }
    return response.json();
}
// Auth
async function authenticateMH(nit, password) {
    return fetchAPI('/mh-auth/token', {
        method: 'POST',
        body: JSON.stringify({ nit, password }),
    });
}
// DTEs
async function getDTEs(filters) {
    const params = new URLSearchParams(filters);
    return fetchAPI(`/dte?${params}`);
}
async function getDTE(id) {
    return fetchAPI(`/dte/${id}`);
}
async function getDTEJson(id) {
    return fetchAPI(`/dte/${id}/json`);
}
async function getDTELogs(id) {
    return fetchAPI(`/dte/${id}/logs`);
}
async function createAndSendDTE(data) {
    return fetchAPI('/transmitter/create-and-send', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
async function anularDTE(id, data) {
    return fetchAPI(`/transmitter/anular/${id}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
async function getDTEStatus(codigoGeneracion) {
    return fetchAPI(`/transmitter/status/${codigoGeneracion}`);
}
// Dashboard
async function getDashboardMetrics() {
    return fetchAPI('/dashboard/metrics');
}
// Catalogos
async function getDepartamentos() {
    return fetchAPI('/catalogs/departamentos');
}
async function getMunicipios(departamento) {
    const params = departamento ? `?departamento=${departamento}` : '';
    return fetchAPI(`/catalogs/municipios${params}`);
}
async function getActividadesEconomicas(query) {
    const params = query ? `?q=${query}` : '';
    return fetchAPI(`/catalogs/actividades-economicas${params}`);
}
// Clientes (mock - reemplazar con API real)
async function getClientes() {
    return fetchAPI('/clientes');
}
async function getCliente(id) {
    return fetchAPI(`/clientes/${id}`);
}
async function createCliente(data) {
    return fetchAPI('/clientes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
async function updateCliente(id, data) {
    return fetchAPI(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}
async function deleteCliente(id) {
    return fetchAPI(`/clientes/${id}`, {
        method: 'DELETE',
    });
}
