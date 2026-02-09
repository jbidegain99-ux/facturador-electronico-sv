import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        services: {
            api: string;
            database: string;
        };
    }>;
    root(): {
        message: string;
        version: string;
        docs: string;
    };
    private checkDatabase;
}
//# sourceMappingURL=health.controller.d.ts.map