import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '../audit-logs/dto';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import {
  passwordResetTemplate,
  welcomeTemplate,
  emailVerificationTemplate,
} from '../email-config/templates';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogsService: AuditLogsService,
    private defaultEmailService: DefaultEmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intente nuevamente en ${minutesRemaining} minuto(s)`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      interface LockoutUpdateData {
        failedLoginAttempts: number;
        lastFailedLoginAt: Date;
        accountLockedUntil: Date | null;
      }

      const updateData: LockoutUpdateData = {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: new Date(),
        accountLockedUntil: null,
      };

      if (newFailedAttempts >= MAX_ATTEMPTS) {
        updateData.accountLockedUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (newFailedAttempts >= MAX_ATTEMPTS) {
        throw new UnauthorizedException(
          `Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos debido a multiples intentos fallidos`,
        );
      }

      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastFailedLoginAt: null,
        },
      });
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

    // Check email verification
    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Debes verificar tu correo electrónico antes de iniciar sesión',
        emailNotVerified: true,
        email: user.email,
      });
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

    // Check if empresa and admin emails are the same
    if (tenant.correo.toLowerCase().trim() === user.email.toLowerCase().trim()) {
      throw new ConflictException('El correo de la empresa y el correo del administrador deben ser diferentes');
    }

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

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

      // Create admin user with email verification fields
      const newUser = await tx.user.create({
        data: {
          nombre: user.nombre,
          email: user.email,
          password: hashedPassword,
          rol: 'ADMIN',
          tenantId: newTenant.id,
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpiresAt,
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

    // Send verification email (await to ensure delivery)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const verificationLink = `${frontendUrl}/verify-email/${emailVerificationToken}`;

    const { html, text } = emailVerificationTemplate({
      nombreUsuario: result.user.nombre,
      nombreEmpresa: result.tenant.nombre,
      verificationLink,
    });

    const emailResult = await this.defaultEmailService.sendEmail(result.tenant.id, {
      to: result.user.email,
      subject: 'Confirma tu correo - Facturador Electrónico SV',
      html,
      text,
    });

    if (!emailResult.success) {
      this.logger.error(`Failed to send verification email to ${result.user.email}: ${emailResult.errorMessage}`);
    } else {
      this.logger.log(`Verification email sent to ${result.user.email}`);
    }

    return {
      message: 'Empresa registrada exitosamente. Revisa tu correo para verificar tu cuenta.',
      emailSent: emailResult.success,
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

  /**
   * Verify email address using token from verification email.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: new Date() },
      },
      include: { tenant: true },
    });

    if (!user) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    if (user.emailVerified) {
      return { message: 'El correo ya fue verificado anteriormente' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    this.logger.log(`Email verified for user ${user.email}`);

    // Send welcome email now that verification is complete
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const { html, text } = welcomeTemplate({
      nombreUsuario: user.nombre,
      nombreEmpresa: user.tenant?.nombre || '',
      email: user.email,
      dashboardLink: `${frontendUrl}/dashboard`,
    });

    this.defaultEmailService
      .sendEmail(user.tenantId || 'system', {
        to: user.email,
        subject: 'Bienvenido a Facturo - Facturador Electrónico SV',
        html,
        text,
      })
      .then((result) => {
        if (!result.success) {
          this.logger.error(`Failed to send welcome email to ${user.email}: ${result.errorMessage}`);
        }
      });

    return { message: 'Correo verificado exitosamente' };
  }

  /**
   * Resend verification email. Rate-limited to 1 per 2 minutes.
   * Always returns success to avoid user enumeration.
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return { message: 'Si el correo existe, recibirás un nuevo enlace de verificación' };
    }

    if (user.emailVerified) {
      return { message: 'Si el correo existe, recibirás un nuevo enlace de verificación' };
    }

    // Rate limit: check if token was generated less than 2 minutes ago
    if (user.emailVerificationExpiresAt) {
      const tokenCreatedAt = new Date(
        user.emailVerificationExpiresAt.getTime() - 24 * 60 * 60 * 1000,
      );
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (tokenCreatedAt > twoMinutesAgo) {
        throw new BadRequestException(
          'Debes esperar al menos 2 minutos entre solicitudes de verificación',
        );
      }
    }

    // Generate new token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiresAt,
      },
    });

    // Send verification email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const verificationLink = `${frontendUrl}/verify-email/${emailVerificationToken}`;

    const { html, text } = emailVerificationTemplate({
      nombreUsuario: user.nombre,
      nombreEmpresa: user.tenant?.nombre || '',
      verificationLink,
    });

    const emailResult = await this.defaultEmailService.sendEmail(
      user.tenantId || 'system',
      {
        to: user.email,
        subject: 'Confirma tu correo - Facturador Electrónico SV',
        html,
        text,
      },
    );

    if (!emailResult.success) {
      this.logger.error(`Failed to resend verification email to ${email}: ${emailResult.errorMessage}`);
    } else {
      this.logger.log(`Verification email resent to ${email}`);
    }

    return { message: 'Si el correo existe, recibirás un nuevo enlace de verificación' };
  }

  /**
   * Generate a password reset token and send reset email.
   * Always returns success message to avoid user enumeration.
   */
  async forgotPassword(email: string, ipAddress?: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether the email exists
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
    }

    // Generate a secure random token (64 hex chars)
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // Send reset email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const { html, text } = passwordResetTemplate({
      nombre: user.nombre,
      resetLink,
    });

    const tenantId = user.tenantId || 'system';
    const emailResult = await this.defaultEmailService.sendEmail(tenantId, {
      to: user.email,
      subject: 'Restablecer contraseña - Facturador Electrónico SV',
      html,
      text,
    });

    if (!emailResult.success) {
      this.logger.error(`Failed to send password reset email to ${email}: ${emailResult.errorMessage}`);
    }

    // Audit log
    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      userName: user.nombre,
      userRole: user.rol,
      tenantId: user.tenantId || undefined,
      action: AuditAction.UPDATE,
      module: AuditModule.AUTH,
      description: `Solicitud de restablecimiento de contraseña para ${user.email}`,
      ipAddress,
      success: true,
    });

    return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
  }

  /**
   * Reset password using a valid token.
   */
  async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        // Also clear any account lockout
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastFailedLoginAt: null,
      },
    });

    // Audit log
    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      userName: user.nombre,
      userRole: user.rol,
      tenantId: user.tenantId || undefined,
      action: AuditAction.UPDATE,
      module: AuditModule.AUTH,
      description: `Contraseña restablecida exitosamente para ${user.email}`,
      ipAddress,
      success: true,
    });

    this.logger.log(`Password reset completed for user ${user.email}`);

    return { message: 'Contraseña restablecida exitosamente' };
  }
}
