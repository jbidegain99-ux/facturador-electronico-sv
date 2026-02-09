/**
 * Shared test data and selectors for E2E tests.
 */
export declare const ROUTES: {
    login: string;
    dashboard: string;
    clientes: string;
    facturas: string;
    recurrentes: string;
    recurrentesNuevo: string;
};
export declare const SELECTORS: {
    searchInput: (placeholder: string) => string;
    skeleton: string;
    table: string;
    tableRow: string;
    pagination: {
        next: string;
        prev: string;
        pageButton: (n: number) => string;
    };
    login: {
        email: string;
        password: string;
        submit: string;
    };
    clientes: {
        newButton: string;
        search: string;
        modalTitle: string;
    };
    facturas: {
        newButton: string;
        search: string;
    };
    recurrentes: {
        newButton: string;
        search: string;
        tabs: {
            todas: string;
            activas: string;
            pausadas: string;
            canceladas: string;
        };
    };
    templateForm: {
        nombre: string;
        frecuencia: string;
        startDate: string;
        addItem: string;
        submit: string;
        cancel: string;
    };
};
export declare const TIMEOUTS: {
    navigation: number;
    apiResponse: number;
    animation: number;
};
//# sourceMappingURL=test-data.d.ts.map