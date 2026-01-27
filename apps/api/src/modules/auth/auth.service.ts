import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '../audit-logs/dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return user;
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    let user;
    try {
      user = await this.validateUser(email, password);
    } catch (error) {
      // Log failed login attempt
      await this.auditLogsService.log({
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        description: `Intento de inicio de sesión fallido para ${email}`,
        userEmail: email,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Credenciales inválidas',
      });
      throw error;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      rol: user.rol,
    };

    const tenant = user.tenant;
    const tenantInfo = tenant ? {
      id: tenant.id,
      nombre: tenant.nombre,
    } : null;

    // Log successful login
    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      userName: user.nombre,
      userRole: user.rol,
      tenantId: user.tenantId || undefined,
      tenantNombre: tenant?.nombre,
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      description: `Usuario ${user.email} inició sesión exitosamente`,
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        tenant: tenantInfo,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const { tenant, user } = registerDto;

    // Check if NIT already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { nit: tenant.nit },
    });

    if (existingTenant) {
      throw new ConflictException('Ya existe una empresa con este NIT');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo electronico');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(user.password);

    // Create tenant and user in a transaction
    const result = await this.prisma.$transaction(async (tx: typeof this.prisma) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          nombre: tenant.nombre,
          nit: tenant.nit,
          nrc: tenant.nrc,
          actividadEcon: tenant.actividadEcon,
          telefono: tenant.telefono,
          correo: tenant.correo,
          nombreComercial: tenant.nombreComercial || null,
          direccion: JSON.stringify({
            departamento: tenant.direccion.departamento,
            municipio: tenant.direccion.municipio,
            complemento: tenant.direccion.complemento,
          }),
        },
      });

      // Create admin user
      const newUser = await tx.user.create({
        data: {
          nombre: user.nombre,
          email: user.email,
          password: hashedPassword,
          rol: 'ADMIN',
          tenantId: newTenant.id,
        },
      });

      return { tenant: newTenant, user: newUser };
    });

    // Log registration
    await this.auditLogsService.log({
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.nombre,
      userRole: 'ADMIN',
      tenantId: result.tenant.id,
      tenantNombre: result.tenant.nombre,
      action: AuditAction.CREATE,
      module: AuditModule.TENANT,
      description: `Nueva empresa registrada: ${result.tenant.nombre} (NIT: ${result.tenant.nit})`,
      entityType: 'Tenant',
      entityId: result.tenant.id,
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      message: 'Empresa registrada exitosamente',
      tenant: {
        id: result.tenant.id,
        nombre: result.tenant.nombre,
        nit: result.tenant.nit,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        nombre: result.user.nombre,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      tenant: user.tenant ? {
        id: user.tenant.id,
        nombre: user.tenant.nombre,
        nit: user.tenant.nit,
      } : null,
    };
  }
}
