import { PrismaService } from '../../prisma/prisma.service';
import { ImportClienteItem } from './dto';
export interface ImportError {
    row: number;
    field: string;
    message: string;
}
export interface ImportResult {
    jobId: string;
    totalRows: number;
    processed: number;
    successful: number;
    created: number;
    updated: number;
    failed: number;
    duplicatesInFile: number;
    errors: ImportError[];
}
export declare class MigrationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private trimField;
    importClientes(tenantId: string, clientes: ImportClienteItem[], fileName?: string): Promise<ImportResult>;
    getJobs(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        failed: number;
        errors: string | null;
        fileName: string | null;
        tipo: string;
        totalRows: number;
        processed: number;
        successful: number;
    }[]>;
    getJob(tenantId: string, jobId: string): Promise<{
        errors: any;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        failed: number;
        fileName: string | null;
        tipo: string;
        totalRows: number;
        processed: number;
        successful: number;
    }>;
}
//# sourceMappingURL=migration.service.d.ts.map