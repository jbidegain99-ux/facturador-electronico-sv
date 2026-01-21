import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.rol !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Acceso denegado. Se requiere rol de Super Administrador.');
    }

    return true;
  }
}
