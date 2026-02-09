import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { Prisma } from '@prisma/client';
export declare class DteService {
    private prisma;
    private signerService;
    private mhAuthService;
    private readonly logger;
    constructor(prisma: PrismaService, signerService: SignerService, mhAuthService: MhAuthService);
    /**
     * Check if demo mode is enabled for a tenant
     * Demo mode simulates Hacienda responses without actual API calls
     */
    private isDemoMode;
    /**
     * Generate simulated Hacienda response for demo mode
     */
    private generateDemoResponse;
    createDte(tenantId: string | null | undefined, tipoDte: string, data: Record<string, unknown>): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    signDte(dteId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    transmitDte(dteId: string, nit: string, password: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    findByTenant(tenantId: string | null | undefined, page?: number, limit?: number, filters?: {
        tipoDte?: string;
        estado?: string;
        search?: string;
    }, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
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
            totalGravada: Prisma.Decimal;
            totalIva: Prisma.Decimal;
            totalPagar: Prisma.Decimal;
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
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    findOneWithTenant(id: string): Promise<({
        tenant: {
            id: string;
            plan: string;
            nombre: string;
            nit: string;
            nrc: string;
            actividadEcon: string;
            telefono: string;
            correo: string;
            nombreComercial: string | null;
            direccion: string;
            createdAt: Date;
            certificatePath: string | null;
            mhToken: string | null;
            mhTokenExpiry: Date | null;
            logoUrl: string | null;
            primaryColor: string | null;
            planId: string | null;
            planStatus: string;
            planExpiry: Date | null;
            maxDtesPerMonth: number;
            maxUsers: number;
            maxClientes: number;
            dtesUsedThisMonth: number;
            monthResetDate: Date | null;
            adminNotes: string | null;
            updatedAt: Date;
        };
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
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    anularDte(dteId: string, motivo: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
    private getNextCorrelativo;
    private generateNumeroControl;
    private logDteAction;
    getSummaryStats(tenantId: string | null | undefined): Promise<{
        dtesHoy: number;
        dtesMes: number;
        dtesMesAnterior: number;
        dtesMesChange: number;
        totalFacturado: number;
        totalFacturadoChange: number;
        rechazados: number;
    }>;
    getStatsByDate(tenantId: string | null | undefined, startDate?: Date, endDate?: Date, groupBy?: 'day' | 'week' | 'month'): Promise<{
        fecha: string;
        cantidad: number;
        total: number;
    }[]>;
    getStatsByType(tenantId: string | null | undefined, startDate?: Date, endDate?: Date): Promise<{
        tipoDte: string;
        nombre: string;
        cantidad: number;
        total: number;
    }[]>;
    getStatsByStatus(tenantId: string | null | undefined): Promise<{
        estado: string;
        cantidad: number;
    }[]>;
    getTopClients(tenantId: string | null | undefined, limit?: number, startDate?: Date, endDate?: Date): Promise<{
        clienteId: string | null;
        nombre: string;
        numDocumento: string;
        cantidadDtes: number;
        totalFacturado: number;
    }[]>;
    getRecentDTEs(tenantId: string | null | undefined, limit?: number): Promise<({
        cliente: {
            nombre: string;
            numDocumento: string;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        clienteId: string | null;
        totalGravada: Prisma.Decimal;
        totalIva: Prisma.Decimal;
        totalPagar: Prisma.Decimal;
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
}
//# sourceMappingURL=dte.service.d.ts.map