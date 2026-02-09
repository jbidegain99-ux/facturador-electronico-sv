import { MhAuthService } from './mh-auth.service';
import { MHEnvironment } from '@facturador/mh-client';
export declare class GetTokenDto {
    nit: string;
    password: string;
    env?: MHEnvironment;
}
export declare class MhAuthController {
    private readonly mhAuthService;
    constructor(mhAuthService: MhAuthService);
    getToken(dto: GetTokenDto): Promise<{
        success: boolean;
        data: {
            token: string;
            roles: string[];
            obtainedAt: string;
        };
    }>;
}
//# sourceMappingURL=mh-auth.controller.d.ts.map