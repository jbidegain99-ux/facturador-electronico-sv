export declare function authenticateMH(nit: string, password: string): Promise<unknown>;
export declare function getDTEs(filters?: Record<string, string>): Promise<unknown>;
export declare function getDTE(id: string): Promise<unknown>;
export declare function getDTEJson(id: string): Promise<unknown>;
export declare function getDTELogs(id: string): Promise<unknown>;
export declare function createAndSendDTE(data: Record<string, unknown>): Promise<unknown>;
export declare function anularDTE(id: string, data: {
    nit: string;
    password: string;
    motivo: string;
}): Promise<unknown>;
export declare function getDTEStatus(codigoGeneracion: string): Promise<unknown>;
export declare function getDashboardMetrics(): Promise<unknown>;
export declare function getDepartamentos(): Promise<unknown>;
export declare function getMunicipios(departamento?: string): Promise<unknown>;
export declare function getActividadesEconomicas(query?: string): Promise<unknown>;
export declare function getClientes(): Promise<unknown>;
export declare function getCliente(id: string): Promise<unknown>;
export declare function createCliente(data: Record<string, unknown>): Promise<unknown>;
export declare function updateCliente(id: string, data: Record<string, unknown>): Promise<unknown>;
export declare function deleteCliente(id: string): Promise<unknown>;
//# sourceMappingURL=api.d.ts.map