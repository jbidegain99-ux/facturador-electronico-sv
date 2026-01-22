const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
export async function authenticateMH(nit: string, password: string) {
  return fetchAPI('/mh-auth/token', {
    method: 'POST',
    body: JSON.stringify({ nit, password }),
  });
}

// DTEs
export async function getDTEs(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/api/v1/dte?${params}`);
}

export async function getDTE(id: string) {
  return fetchAPI(`/api/v1/dte/${id}`);
}

export async function getDTEJson(id: string) {
  return fetchAPI(`/api/v1/dte/${id}/json`);
}

export async function getDTELogs(id: string) {
  return fetchAPI(`/api/v1/dte/${id}/logs`);
}

export async function createAndSendDTE(data: Record<string, unknown>) {
  return fetchAPI('/transmitter/create-and-send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function anularDTE(id: string, data: { nit: string; password: string; motivo: string }) {
  return fetchAPI(`/transmitter/anular/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDTEStatus(codigoGeneracion: string) {
  return fetchAPI(`/transmitter/status/${codigoGeneracion}`);
}

// Dashboard
export async function getDashboardMetrics() {
  return fetchAPI('/dashboard/metrics');
}

// Catalogos
export async function getDepartamentos() {
  return fetchAPI('/catalogs/departamentos');
}

export async function getMunicipios(departamento?: string) {
  const params = departamento ? `?departamento=${departamento}` : '';
  return fetchAPI(`/catalogs/municipios${params}`);
}

export async function getActividadesEconomicas(query?: string) {
  const params = query ? `?q=${query}` : '';
  return fetchAPI(`/catalogs/actividades-economicas${params}`);
}

// Clientes (mock - reemplazar con API real)
export async function getClientes() {
  return fetchAPI('/clientes');
}

export async function getCliente(id: string) {
  return fetchAPI(`/clientes/${id}`);
}

export async function createCliente(data: Record<string, unknown>) {
  return fetchAPI('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCliente(id: string, data: Record<string, unknown>) {
  return fetchAPI(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCliente(id: string) {
  return fetchAPI(`/clientes/${id}`, {
    method: 'DELETE',
  });
}
