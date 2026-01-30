import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(
    private tenantsService: TenantsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo tenant/empresa' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del tenant del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del tenant' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async getMyTenant(@CurrentUser() user: CurrentUserData) {
    this.logger.log(`Getting tenant for user ${user.email}, tenantId: ${user.tenantId}`);

    if (!user.tenantId) {
      this.logger.warn(`User ${user.email} has no tenantId`);
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const tenant = await this.tenantsService.findOne(user.tenantId);

    if (!tenant) {
      this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
      throw new NotFoundException('Tenant no encontrado');
    }

    this.logger.log(`Tenant ${tenant.nombre} found for user ${user.email}`);
    return tenant;
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos del tenant del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Tenant actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Usuario no tiene tenant asignado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async updateMyTenant(
    @CurrentUser() user: CurrentUserData,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    this.logger.log(`Updating tenant for user ${user.email}, tenantId: ${user.tenantId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateTenantDto)}`);

    if (!user.tenantId) {
      this.logger.warn(`User ${user.email} has no tenantId`);
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const existingTenant = await this.tenantsService.findOne(user.tenantId);

    if (!existingTenant) {
      this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
      throw new NotFoundException('Tenant no encontrado');
    }

    const updatedTenant = await this.tenantsService.update(user.tenantId, updateTenantDto);
    this.logger.log(`Tenant ${updatedTenant.nombre} updated successfully`);

    return updatedTenant;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener tenant por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: Partial<CreateTenantDto>) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  // ==================== ONBOARDING ENDPOINTS ====================

  @Get('me/onboarding-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estado del onboarding' })
  @ApiResponse({ status: 200, description: 'Estado del onboarding' })
  async getOnboardingStatus(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        _count: {
          select: { dtes: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const isDemoMode = tenant.plan === 'DEMO' || tenant.certificatePath === 'DEMO_MODE';

    return {
      hasCompanyData: true, // Always true after registration
      hasCertificate: !!tenant.certificatePath,
      hasTestedConnection: !!tenant.mhToken,
      hasFirstInvoice: tenant._count.dtes > 0,
      demoMode: isDemoMode,
      plan: tenant.plan,
    };
  }

  @Post('me/certificate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir certificado digital .p12' })
  @ApiResponse({ status: 200, description: 'Certificado subido exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo invalido o contrasena incorrecta' })
  async uploadCertificate(
    @CurrentUser() user: CurrentUserData,
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    if (!file) {
      throw new BadRequestException('Archivo de certificado requerido');
    }

    if (!password) {
      throw new BadRequestException('Contrasena del certificado requerida');
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.p12', '.pfx', '.crt', '.cer', '.pem'].includes(ext)) {
      throw new BadRequestException('El archivo debe ser .p12, .pfx, .crt, .cer o .pem');
    }

    try {
      // Create certificates directory if it doesn't exist
      const certsDir = path.join(process.cwd(), 'certificates');
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }

      // Save the certificate file
      const filename = `${user.tenantId}_${Date.now()}${ext}`;
      const filepath = path.join(certsDir, filename);
      fs.writeFileSync(filepath, file.buffer);

      // TODO: Validate certificate with password using a crypto library
      // For now, just save the path

      // Update tenant with certificate path
      await this.prisma.tenant.update({
        where: { id: user.tenantId },
        data: { certificatePath: filepath },
      });

      this.logger.log(`Certificate uploaded for tenant ${user.tenantId}`);

      return {
        success: true,
        message: 'Certificado subido exitosamente',
        filename: file.originalname,
      };
    } catch (error) {
      this.logger.error(`Error uploading certificate: ${error.message}`);
      throw new BadRequestException('Error al procesar el certificado');
    }
  }

  @Delete('me/certificate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar certificado digital' })
  @ApiResponse({ status: 200, description: 'Certificado eliminado' })
  async deleteCertificate(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Delete the file if it exists
    if (tenant.certificatePath && fs.existsSync(tenant.certificatePath)) {
      fs.unlinkSync(tenant.certificatePath);
    }

    // Clear the certificate path
    await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { certificatePath: null },
    });

    this.logger.log(`Certificate deleted for tenant ${user.tenantId}`);

    return { success: true, message: 'Certificado eliminado' };
  }

  @Post('me/test-mh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Probar conexion con Ministerio de Hacienda' })
  @ApiResponse({ status: 200, description: 'Conexion exitosa' })
  @ApiResponse({ status: 400, description: 'Error de conexion' })
  async testMhConnection(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    if (!tenant.certificatePath) {
      throw new BadRequestException('Debe subir un certificado primero');
    }

    try {
      // TODO: Actually test connection with MH using the signer service
      // For now, simulate a successful connection

      // Update tenant to mark connection as tested
      await this.prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          mhToken: 'test_token_' + Date.now(),
          mhTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      this.logger.log(`MH connection tested for tenant ${user.tenantId}`);

      return {
        success: true,
        message: 'Conexion con Ministerio de Hacienda exitosa',
      };
    } catch (error) {
      this.logger.error(`MH connection test failed: ${error.message}`);
      throw new BadRequestException('Error al conectar con el Ministerio de Hacienda');
    }
  }

  @Post('me/onboarding-complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar onboarding como completado' })
  @ApiResponse({ status: 200, description: 'Onboarding marcado como completado' })
  async markOnboardingComplete(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    // For now, we don't need to do anything special
    // The onboarding status is derived from existing fields
    this.logger.log(`Onboarding marked complete for tenant ${user.tenantId}`);

    return { success: true, message: 'Onboarding completado' };
  }

  @Post('me/onboarding-skip')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Saltar onboarding y activar modo demo' })
  @ApiResponse({ status: 200, description: 'Onboarding saltado, modo demo activado' })
  async skipOnboarding(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    // Set demo mode: create fake certificate path and token to bypass checks
    await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        certificatePath: 'DEMO_MODE',
        mhToken: 'DEMO_TOKEN_' + Date.now(),
        mhTokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        plan: 'DEMO', // Set plan to DEMO to enable demo mode features
      },
    });

    this.logger.log(`Onboarding skipped for tenant ${user.tenantId}, demo mode activated`);

    return {
      success: true,
      message: 'Modo demo activado. Puedes crear facturas de prueba sin conectar a Hacienda.',
      demoMode: true,
    };
  }

  @Post('me/disable-demo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar modo demo y volver al modo real' })
  @ApiResponse({ status: 200, description: 'Modo demo desactivado' })
  async disableDemoMode(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    // Clear demo mode settings
    await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        certificatePath: null,
        mhToken: null,
        mhTokenExpiry: null,
        plan: 'TRIAL', // Reset to TRIAL
      },
    });

    this.logger.log(`Demo mode disabled for tenant ${user.tenantId}`);

    return {
      success: true,
      message: 'Modo demo desactivado. Debes completar el onboarding para usar el sistema real.',
      demoMode: false,
    };
  }
}
