import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { HaciendaService } from './hacienda.service';
import {
  ConfigureEnvironmentDto,
  SwitchEnvironmentDto,
  TestConnectionDto,
  RenewTokenDto,
  QuickSetupDto,
  ValidateConnectionDto,
} from './dto';
import { HaciendaEnvironment } from './interfaces';

@Controller('admin/hacienda')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
@ApiBearerAuth()
@ApiTags('Admin Hacienda Configuration')
export class HaciendaAdminController {
  constructor(private readonly haciendaService: HaciendaService) {}

  @Get(':tenantId/config')
  @ApiOperation({ summary: 'Get Hacienda config for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Hacienda configuration' })
  async getConfig(@Param('tenantId') tenantId: string) {
    return this.haciendaService.getOrCreateConfig(tenantId);
  }

  @Post(':tenantId/quick-setup')
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Quick setup Hacienda for a tenant (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['certificate', 'environment', 'apiUser', 'apiPassword', 'certificatePassword'],
      properties: {
        certificate: { type: 'string', format: 'binary' },
        environment: { type: 'string', enum: ['TEST', 'PRODUCTION'] },
        apiUser: { type: 'string' },
        apiPassword: { type: 'string' },
        certificatePassword: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Setup completed' })
  async quickSetup(
    @Param('tenantId') tenantId: string,
    @UploadedFile() certificate: Express.Multer.File,
    @Body() dto: QuickSetupDto,
  ) {
    if (!certificate) {
      throw new BadRequestException('Se requiere el archivo de certificado');
    }

    const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
    const fileExt = certificate.originalname
      .toLowerCase()
      .slice(certificate.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        'El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem',
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (certificate.size > maxSizeBytes) {
      throw new BadRequestException(
        'El archivo de certificado no puede exceder 5MB',
      );
    }

    return this.haciendaService.quickSetup(
      tenantId,
      dto,
      certificate.buffer,
      certificate.originalname,
    );
  }

  @Post(':tenantId/config/:environment')
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Configure environment for a tenant (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Environment configured' })
  async configureEnvironment(
    @Param('tenantId') tenantId: string,
    @Param('environment') environment: string,
    @UploadedFile() certificate: Express.Multer.File,
    @Body() dto: ConfigureEnvironmentDto,
  ) {
    if (!['TEST', 'PRODUCTION'].includes(environment)) {
      throw new BadRequestException('Ambiente debe ser TEST o PRODUCTION');
    }

    if (!certificate) {
      throw new BadRequestException('Se requiere el archivo de certificado');
    }

    const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
    const fileExt = certificate.originalname
      .toLowerCase()
      .slice(certificate.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        'El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem',
      );
    }

    return this.haciendaService.configureEnvironment(
      tenantId,
      environment as HaciendaEnvironment,
      dto,
      certificate.buffer,
      certificate.originalname,
    );
  }

  @Post(':tenantId/test-connection')
  @ApiOperation({ summary: 'Test Hacienda connection for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection(
    @Param('tenantId') tenantId: string,
    @Body() dto: TestConnectionDto,
  ) {
    return this.haciendaService.testConnection(tenantId, dto.environment);
  }

  @Post(':tenantId/renew-token')
  @ApiOperation({ summary: 'Renew Hacienda token for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Token renewed' })
  async renewToken(
    @Param('tenantId') tenantId: string,
    @Body() dto: RenewTokenDto,
  ) {
    return this.haciendaService.renewToken(tenantId, dto.environment);
  }

  @Post(':tenantId/switch-environment')
  @ApiOperation({ summary: 'Switch Hacienda environment for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Environment switched' })
  async switchEnvironment(
    @Param('tenantId') tenantId: string,
    @Body() dto: SwitchEnvironmentDto,
  ) {
    return this.haciendaService.switchEnvironment(tenantId, dto.environment);
  }

  @Post(':tenantId/validate-connection')
  @ApiOperation({ summary: 'Validate Hacienda credentials without saving (admin)' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateConnection(@Body() dto: ValidateConnectionDto) {
    return this.haciendaService.validateConnection(dto);
  }

  @Get(':tenantId/tests/progress')
  @ApiOperation({ summary: 'Get test progress for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Test progress' })
  async getTestProgress(@Param('tenantId') tenantId: string) {
    return this.haciendaService.getTestProgress(tenantId);
  }
}
