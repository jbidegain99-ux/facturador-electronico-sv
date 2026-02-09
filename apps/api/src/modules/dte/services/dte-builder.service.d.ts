import { TipoDte, Ambiente, Emisor, ReceptorFactura, ReceptorCCF, FacturaElectronica, ComprobanteCreditoFiscal } from '@facturador/shared';
export interface BuildFacturaInput {
    emisor: Omit<Emisor, 'direccion'> & {
        direccion: Emisor['direccion'];
    };
    receptor?: ReceptorFactura;
    items: Array<{
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        esGravado?: boolean;
        esExento?: boolean;
        codigo?: string;
    }>;
    codEstablecimiento: string;
    correlativo: number;
    ambiente?: Ambiente;
    condicionOperacion?: 1 | 2 | 3;
}
export interface BuildCCFInput {
    emisor: Omit<Emisor, 'direccion'> & {
        direccion: Emisor['direccion'];
    };
    receptor: ReceptorCCF;
    items: Array<{
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        esGravado?: boolean;
        esExento?: boolean;
        codigo?: string;
    }>;
    codEstablecimiento: string;
    correlativo: number;
    ambiente?: Ambiente;
    condicionOperacion?: 1 | 2 | 3;
}
export declare class DteBuilderService {
    private readonly IVA_RATE;
    generateCodigoGeneracion(): string;
    generateNumeroControl(tipoDte: TipoDte, codEstablecimiento: string, correlativo: number): string;
    private getCurrentDate;
    private getCurrentTime;
    private roundTo2Decimals;
    private numberToWords;
    private convertThousands;
    buildFactura(input: BuildFacturaInput): FacturaElectronica;
    buildCCF(input: BuildCCFInput): ComprobanteCreditoFiscal;
}
//# sourceMappingURL=dte-builder.service.d.ts.map