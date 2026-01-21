import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

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

  async register(registerDto: RegisterDto) {
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
    const result = await this.prisma.$transaction(async (tx) => {
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
          direccion: {
            departamento: tenant.direccion.departamento,
            municipio: tenant.direccion.municipio,
            complemento: tenant.direccion.complemento,
          },
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
}
