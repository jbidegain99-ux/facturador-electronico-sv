import { TransmitterService } from './transmitter.service';
import { DteBuilderService } from '../dte/services/dte-builder.service';
import { DTE, TipoDte, Ambiente } from '@facturador/shared';
import { MHEnvironment } from '@facturador/mh-client';
export declare class TransmitDto {
    nit: string;
    password: string;
    env?: MHEnvironment;
    async?: boolean;
}
export declare class CreateAndTransmitDto {
    nit: string;
    password: string;
    env?: MHEnvironment;
    tenantId: string;
    tipoDte: TipoDte;
    ambiente?: Ambiente;
    emisor: Record<string, unknown>;
    receptor?: Record<string, unknown>;
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
    condicionOperacion?: 1 | 2 | 3;
}
export declare class AnularDto {
    nit: string;
    password: string;
    env?: MHEnvironment;
    motivo: string;
}
export declare class ConsultarDto {
    nit: string;
    password: string;
    env?: MHEnvironment;
}
export declare class TransmitterController {
    private readonly transmitterService;
    private readonly dteBuilder;
    constructor(transmitterService: TransmitterService, dteBuilder: DteBuilderService);
    sendDTE(dteId: string, dto: TransmitDto): Promise<import("./transmitter.service").TransmitResult | {
        success: boolean;
        message: string;
        jobId: string;
        dteId: string;
    }>;
    createAndSend(dto: CreateAndTransmitDto): Promise<{
        dte: import("@facturador/shared").FacturaElectronica | import("@facturador/shared").ComprobanteCreditoFiscal;
        success: boolean;
        dteId: string;
        codigoGeneracion: string;
        status: import("./transmitter.service").DTEStatus;
        selloRecibido?: string;
        fhProcesamiento?: string;
        observaciones?: string[];
        error?: string;
    }>;
    getStatus(codigoGeneracion: string, query: ConsultarDto): Promise<{
        source: string;
        dteId: string;
        codigoGeneracion: string;
        status: import("./transmitter.service").DTEStatus;
        selloRecibido: string | undefined;
        fhProcesamiento: string | undefined;
        observaciones: string[] | undefined;
        intentos: number;
    } | {
        version: number;
        ambiente: string;
        estado: "PROCESADO" | "RECHAZADO" | "NO_ENCONTRADO";
        codigoGeneracion: string;
        selloRecibido: string | null;
        fhProcesamiento: string;
        observaciones: string[];
        source: string;
        dteId?: undefined;
        status?: undefined;
        intentos?: undefined;
    }>;
    getDTE(dteId: string): {
        id: string;
        tenantId: string;
        codigoGeneracion: string;
        numeroControl: string;
        tipoDte: TipoDte;
        ambiente: "00" | "01";
        status: import("./transmitter.service").DTEStatus;
        selloRecibido: string | undefined;
        fhProcesamiento: string | undefined;
        observaciones: string[] | undefined;
        intentos: number;
        createdAt: Date;
        updatedAt: Date;
    };
    getDTEJson(dteId: string): DTE;
    getDTELogs(dteId: string): import("./transmitter.service").DTELog[];
    anularDTE(dteId: string, dto: AnularDto): Promise<import("./transmitter.service").TransmitResult>;
    getJobStatus(jobId: string): Promise<{
        id: string;
        state: string;
        progress: number;
        attemptsMade: number;
        failedReason?: string;
    }>;
}
//# sourceMappingURL=transmitter.controller.d.ts.map