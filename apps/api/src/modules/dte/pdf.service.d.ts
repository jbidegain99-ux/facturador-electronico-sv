interface DteData {
    id: string;
    codigoGeneracion: string;
    numeroControl: string;
    tipoDte: string;
    estado: string;
    selloRecibido?: string;
    fhProcesamiento?: Date;
    data: Record<string, unknown>;
    createdAt: Date;
    tenant?: {
        nombre: string;
        nit: string;
        nrc: string;
        direccion?: string;
        telefono: string;
        correo: string;
    };
}
export declare class PdfService {
    private readonly logger;
    private getTipoDteLabel;
    private getEstadoLabel;
    private formatDate;
    private formatCurrency;
    private isDemoMode;
    generateInvoicePdf(dte: DteData): Promise<Buffer>;
}
export {};
//# sourceMappingURL=pdf.service.d.ts.map