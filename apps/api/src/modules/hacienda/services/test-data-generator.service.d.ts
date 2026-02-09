import { DteTypeCode } from '../interfaces';
export interface EmisorData {
    nit: string;
    nrc: string;
    nombre: string;
    codActividad: string;
    descActividad: string;
    nombreComercial: string | null;
    tipoEstablecimiento: string;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    };
    telefono: string;
    correo: string;
    codEstableMH: string | null;
    codEstable: string | null;
    codPuntoVentaMH: string | null;
    codPuntoVenta: string | null;
}
export interface ReceptorData {
    tipoDocumento: string | null;
    numDocumento: string | null;
    nrc: string | null;
    nombre: string;
    codActividad: string | null;
    descActividad: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    } | null;
    telefono: string | null;
    correo: string | null;
}
export interface ItemData {
    numItem: number;
    tipoItem?: number;
    numeroDocumento?: string | null;
    cantidad: number;
    codigo: string | null;
    codTributo?: string | null;
    uniMedida: number;
    descripcion: string;
    precioUni: number;
    montoDescu: number;
    ventaNoSuj?: number;
    ventaExenta?: number;
    ventaGravada?: number;
    tributos?: string[] | null;
    psv?: number;
    noGravado?: number;
    ivaItem?: number;
    tipoItemExpor?: number;
    descu?: number;
    compra?: number;
}
export interface GeneratedTestData {
    identificacion: Record<string, unknown>;
    documentoRelacionado?: unknown;
    emisor: Record<string, unknown>;
    receptor?: Record<string, unknown>;
    sujetoExcluido?: Record<string, unknown>;
    otrosDocumentos?: unknown;
    ventaTercero?: unknown;
    cuerpoDocumento: Record<string, unknown>[];
    resumen: Record<string, unknown>;
    extension?: unknown;
    apendice?: unknown;
}
/**
 * Service for generating test data for Hacienda DTE tests
 * Supports all DTE types with their specific schemas
 */
export declare class TestDataGeneratorService {
    private readonly logger;
    private readonly sampleProducts;
    private readonly DTE_VERSIONS;
    /**
     * Generate test data for a specific DTE type
     * Routes to specific generators based on DTE type
     */
    generateTestData(dteType: DteTypeCode, emisor: EmisorData, correlativo: number): GeneratedTestData;
    /**
     * Generate Factura (01) - Consumer Invoice
     */
    private generateFactura;
    /**
     * Generate CCF (03) - Comprobante de Crédito Fiscal
     */
    private generateCCF;
    /**
     * Generate Nota de Remisión (04) - Delivery Note
     */
    private generateNotaRemision;
    /**
     * Generate Nota de Crédito (05) - Credit Note
     * Requires a related document
     */
    private generateNotaCredito;
    /**
     * Generate Nota de Débito (06) - Debit Note
     * Requires a related document
     * No codEstable fields in emisor, no porcentajeDescuento in resumen
     */
    private generateNotaDebito;
    /**
     * Generate Factura de Exportación (11) - Export Invoice
     * Has completely different schema from domestic invoices
     */
    private generateFacturaExportacion;
    /**
     * Generate Factura de Sujeto Excluido (14) - Excluded Subject Invoice
     * For transactions with subjects excluded from IVA
     */
    private generateFacturaSujetoExcluido;
    private generateItemsFactura;
    private generateItemsCCF;
    private generateItemsNotaRemision;
    /**
     * Generate items for Nota de Crédito (05) and Nota de Débito (06)
     * No noGravado, psv fields
     * numeroDocumento must be the UUID of the related document
     */
    private generateItemsNotaCreditoDebito;
    private generateItemsExportacion;
    private generateItemsSujetoExcluido;
    private calculateTotalsFactura;
    private calculateTotalsCCF;
    /**
     * Generate numero de control
     * Format: DTE-XX-M001P001-000000000000001 (max 31 chars)
     */
    private generateNumeroControl;
    /**
     * Format emisor data - remove dashes from NIT and NRC
     */
    private formatEmisor;
    /**
     * Generate cancellation test data
     */
    generateCancellationData(originalDte: {
        codigoGeneracion: string;
        selloRecibido: string;
        tipoDte: string;
        numeroControl: string;
        fecEmi: string;
    }, emisor: EmisorData): Record<string, unknown>;
    /**
     * Convert number to words (Spanish)
     */
    private numberToWords;
    private convertToWords;
}
//# sourceMappingURL=test-data-generator.service.d.ts.map