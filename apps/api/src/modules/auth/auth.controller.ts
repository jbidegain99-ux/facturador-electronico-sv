import { Controller, Post, Get, Body, UseGuards, Request, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request as ExpressRequest, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RbacService } from '../rbac/services/rbac.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    tenantId: string | null;
    rol: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private authService: AuthService,
    private rbacService: RbacService,
    private configService: ConfigService,
  ) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  private clearAuthCookie(res: Response) {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 1000 }, medium: { limit: 10, ttl: 60000 }, long: { limit: 50, ttl: 3600000 } })
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  async login(@Body() loginDto: LoginDto, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await this.authService.login(loginDto.email, loginDto.password, ipAddress, userAgent);
    this.setAuthCookie(res, result.access_token);
    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesion' })
  @ApiResponse({ status: 200, description: 'Sesion cerrada' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookie(res);
    return { message: 'Sesion cerrada exitosamente' };
  }

  @Public()
  @Post('register')
  @Throttle({ short: { limit: 10, ttl: 1000 }, medium: { limit: 30, ttl: 60000 }, long: { limit: 100, ttl: 3600000 } })
  @ApiOperation({ summary: 'Registrar nueva empresa y usuario administrador' })
  @ApiResponse({ status: 201, description: 'Empresa registrada exitosamente' })
  @ApiResponse({ status: 409, description: 'NIT o correo ya existe' })
  async register(@Body() registerDto: RegisterDto, @Req() req: ExpressRequest) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@Request() req: AuthRequest) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('me/permissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener permisos efectivos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de permisos del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getMyPermissions(@Request() req: AuthRequest) {
    const { id, tenantId } = req.user;
    if (!tenantId) {
      return { permissions: [] };
    }
    const permSet = await this.rbacService.getEffectivePermissions(id, tenantId);
    return { permissions: Array.from(permSet) };
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verificar correo electrónico con token' })
  @ApiResponse({ status: 200, description: 'Correo verificado' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Reenviar correo de verificación' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 3, ttl: 60000 }, long: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: ExpressRequest) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    return this.authService.forgotPassword(dto.email, ipAddress);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: ExpressRequest) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    return this.authService.resetPassword(dto.token, dto.password, ipAddress);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async changePassword(@Request() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
