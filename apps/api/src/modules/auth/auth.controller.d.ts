import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        tenantId: string | null;
        rol: string;
    };
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: ExpressRequest): Promise<{
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
    register(registerDto: RegisterDto, req: ExpressRequest): Promise<{
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
    getProfile(req: AuthRequest): Promise<{
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
export {};
//# sourceMappingURL=auth.controller.d.ts.map