import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private auditLogsService;
    constructor(prisma: PrismaService, jwtService: JwtService, auditLogsService: AuditLogsService);
    validateUser(email: string, password: string): Promise<{
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
        } | null;
    } & {
        id: string;
        nombre: string;
        email: string;
        password: string;
        tenantId: string | null;
        createdAt: Date;
        rol: string;
        failedLoginAttempts: number;
        accountLockedUntil: Date | null;
        lastFailedLoginAt: Date | null;
    }>;
    login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            rol: string;
            tenant: {
                id: string;
                nombre: string;
            } | null;
        };
    }>;
    hashPassword(password: string): Promise<string>;
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
        tenant: {
            id: any;
            nombre: any;
            nit: any;
        };
        user: {
            id: any;
            email: any;
            nombre: any;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        nombre: string;
        rol: string;
        tenant: {
            id: string;
            nombre: string;
            nit: string;
        } | null;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map