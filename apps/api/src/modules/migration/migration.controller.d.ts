import { MigrationService } from './migration.service';
import { ImportClientesDto } from './dto';
interface CurrentUserData {
    id: string;
    email: string;
    tenantId: string | null;
    rol: string;
}
export declare class MigrationController {
    private readonly migrationService;
    constructor(migrationService: MigrationService);
    importClientes(user: CurrentUserData, dto: ImportClientesDto): Promise<import("./migration.service").ImportResult>;
    getJobs(user: CurrentUserData): Promise<{
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
    getJob(user: CurrentUserData, id: string): Promise<{
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
export {};
//# sourceMappingURL=migration.controller.d.ts.map