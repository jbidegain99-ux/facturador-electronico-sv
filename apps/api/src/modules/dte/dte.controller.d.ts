import { Response } from 'express';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
interface AuthRequest extends Request {
    user: {
        tenantId: string;
    };
}
export declare class DteController {
    private dteService;
    private pdfService;
    constructor(dteService: DteService, pdfService: PdfService);
    create(req: AuthRequest, createDteDto: {
        tipoDte: string;
        data: Record<string, unknown>;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    }>;
    sign(id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    }>;
    transmit(id: string, credentials: {
        nit: string;
        password: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    }>;
    findAll(req: AuthRequest, page?: string, limit?: string, tipoDte?: string, estado?: string, search?: string, sortBy?: string, sortOrder?: string): Promise<{
        data: ({
            cliente: {
                id: string;
                nombre: string;
                nrc: string | null;
                telefono: string | null;
                correo: string | null;
                direccion: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                tipoDocumento: string;
                numDocumento: string;
            } | null;
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            clienteId: string | null;
            totalGravada: import("@prisma/client/runtime/library").Decimal;
            totalIva: import("@prisma/client/runtime/library").Decimal;
            totalPagar: import("@prisma/client/runtime/library").Decimal;
            tipoDte: string;
            codigoGeneracion: string;
            numeroControl: string;
            jsonOriginal: string;
            jsonFirmado: string | null;
            estado: string;
            selloRecepcion: string | null;
            fechaRecepcion: Date | null;
            codigoMh: string | null;
            descripcionMh: string | null;
            intentosEnvio: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getSummaryStats(req: AuthRequest): Promise<{
        dtesHoy: number;
        dtesMes: number;
        dtesMesAnterior: number;
        dtesMesChange: number;
        totalFacturado: number;
        totalFacturadoChange: number;
        rechazados: number;
    }>;
    getStatsByDate(req: AuthRequest, startDate?: string, endDate?: string, groupBy?: 'day' | 'week' | 'month'): Promise<{
        fecha: string;
        cantidad: number;
        total: number;
    }[]>;
    getStatsByType(req: AuthRequest, startDate?: string, endDate?: string): Promise<{
        tipoDte: string;
        nombre: string;
        cantidad: number;
        total: number;
    }[]>;
    getStatsByStatus(req: AuthRequest): Promise<{
        estado: string;
        cantidad: number;
    }[]>;
    getTopClients(req: AuthRequest, limit?: string, startDate?: string, endDate?: string): Promise<{
        clienteId: string | null;
        nombre: string;
        numDocumento: string;
        cantidadDtes: number;
        totalFacturado: number;
    }[]>;
    getRecentDTEs(req: AuthRequest, limit?: string): Promise<({
        cliente: {
            nombre: string;
            numDocumento: string;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    })[]>;
    findOne(id: string): Promise<({
        cliente: {
            id: string;
            nombre: string;
            nrc: string | null;
            telefono: string | null;
            correo: string | null;
            direccion: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            tipoDocumento: string;
            numDocumento: string;
        } | null;
        logs: {
            id: string;
            error: string | null;
            createdAt: Date;
            response: string | null;
            accion: string;
            request: string | null;
            dteId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    }) | null>;
    downloadPdf(id: string, res: Response): Promise<void>;
    anular(id: string, body: {
        motivo: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: import("@prisma/client/runtime/library").Decimal;
        totalIva: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        tipoDte: string;
        codigoGeneracion: string;
        numeroControl: string;
        jsonOriginal: string;
        jsonFirmado: string | null;
        estado: string;
        selloRecepcion: string | null;
        fechaRecepcion: Date | null;
        codigoMh: string | null;
        descripcionMh: string | null;
        intentosEnvio: number;
    }>;
}
export {};
//# sourceMappingURL=dte.controller.d.ts.map