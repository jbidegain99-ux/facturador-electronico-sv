import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class MhAuthService {
    private configService;
    private prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    getToken(tenantId: string): Promise<string>;
    private authenticateWithMh;
}
//# sourceMappingURL=mh-auth.service.d.ts.map