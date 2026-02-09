export interface CurrentUserData {
    id: string;
    email: string;
    tenantId: string | null;
    rol: string;
    tenant?: {
        id: string;
        nombre: string;
    } | null;
}
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUserData | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
//# sourceMappingURL=current-user.decorator.d.ts.map