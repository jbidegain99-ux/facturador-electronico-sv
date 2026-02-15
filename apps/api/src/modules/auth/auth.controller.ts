import { Controller, Post, Get, Body, UseGuards, Request, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  async login(@Body() loginDto: LoginDto, @Req() req: ExpressRequest) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto.email, loginDto.password, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
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

  @Public()
  @Post('forgot-password')
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
}
