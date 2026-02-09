import { Cliente, DTE, RecurringInvoiceTemplate, RecurringInvoiceHistory } from '@prisma/client';
export declare function createMockCliente(overrides?: Partial<Cliente>): Cliente;
export declare function createMockDte(overrides?: Partial<DTE>): DTE;
export declare function createMockTemplate(overrides?: Partial<RecurringInvoiceTemplate>): RecurringInvoiceTemplate;
export declare function createMockHistory(overrides?: Partial<RecurringInvoiceHistory>): RecurringInvoiceHistory;
export interface MockTenant {
    id: string;
    nombre: string;
    nit: string;
    nrc: string;
    actividadEcon: string;
    direccion: string;
    telefono: string;
    correo: string;
    nombreComercial: string | null;
    plan: string;
}
export declare function createMockTenant(overrides?: Partial<MockTenant>): MockTenant;
//# sourceMappingURL=test-fixtures.d.ts.map