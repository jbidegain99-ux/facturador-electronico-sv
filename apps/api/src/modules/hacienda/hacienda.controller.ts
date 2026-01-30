import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { HaciendaService } from './hacienda.service';
import {
  ConfigureEnvironmentDto,
  SwitchEnvironmentDto,
  TestConnectionDto,
  RenewTokenDto,
  ExecuteTestDto,
  GetTestHistoryQueryDto,
  GenerateTestDataDto,
  HaciendaConfigResponseDto,
  TestProgressResponseDto,
  QuickSetupDto,
  QuickSetupResponseDto,
  ValidateConnectionDto,
  ValidateConnectionResponseDto,
} from './dto';
import { HaciendaEnvironment } from './interfaces';

@Controller('hacienda')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@ApiTags('Hacienda Configuration')
export class HaciendaController {
  constructor(private readonly haciendaService: HaciendaService) {}

  // ===== CONFIGURATION =====

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración actual de Hacienda' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de Hacienda',
    type: HaciendaConfigResponseDto,
  })
  async getConfig(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }
    return this.haciendaService.getOrCreateConfig(user.tenantId);
  }

  // ===== QUICK SETUP =====

  @Post('quick-setup')
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({
    summary: 'Configuración rápida para empresas con credenciales existentes',
    description: 'Configura ambiente con certificado y credenciales en un solo paso, validando todo automáticamente',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['certificate', 'environment', 'apiUser', 'apiPassword', 'certificatePassword'],
      properties: {
        certificate: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de certificado .p12 o .pfx',
        },
        environment: {
          type: 'string',
          enum: ['TEST', 'PRODUCTION'],
          description: 'Ambiente a configurar',
        },
        apiUser: {
          type: 'string',
          description: 'Usuario de API de Hacienda (NIT sin guiones)',
        },
        apiPassword: {
          type: 'string',
          description: 'Contraseña de API de Hacienda',
        },
        certificatePassword: {
          type: 'string',
          description: 'Contraseña del certificado',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración completada exitosamente',
    type: QuickSetupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación',
    type: QuickSetupResponseDto,
  })
  async quickSetup(
    @CurrentUser() user: CurrentUserData,
    @UploadedFile() certificate: Express.Multer.File,
    @Body() dto: QuickSetupDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    if (!certificate) {
      throw new BadRequestException('Se requiere el archivo de certificado');
    }

    // Validate file extension
    const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
    const fileExt = certificate.originalname
      .toLowerCase()
      .slice(certificate.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        'El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem',
      );
    }

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (certificate.size > maxSizeBytes) {
      throw new BadRequestException(
        'El archivo de certificado no puede exceder 5MB',
      );
    }

    return this.haciendaService.quickSetup(
      user.tenantId,
      dto,
      certificate.buffer,
      certificate.originalname,
    );
  }

  @Post('validate-connection')
  @ApiOperation({
    summary: 'Validar conexión con Hacienda sin guardar',
    description: 'Prueba las credenciales de API sin guardar la configuración',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    type: ValidateConnectionResponseDto,
  })
  async validateConnection(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ValidateConnectionDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.validateConnection(dto);
  }

  // Static routes MUST come before dynamic route config/:environment
  @Post('config/test-connection')
  @ApiOperation({ summary: 'Probar conexión con Hacienda' })
  @ApiResponse({
    status: 200,
    description: 'Conexión exitosa',
  })
  @ApiResponse({
    status: 400,
    description: 'Error de conexión',
  })
  async testConnection(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: TestConnectionDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.testConnection(user.tenantId, dto.environment);
  }

  @Post('config/renew-token')
  @ApiOperation({ summary: 'Renovar token de autenticación' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
  })
  async renewToken(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RenewTokenDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.renewToken(user.tenantId, dto.environment);
  }

  @Post('config/switch-environment')
  @ApiOperation({ summary: 'Cambiar ambiente activo' })
  @ApiResponse({
    status: 200,
    description: 'Ambiente cambiado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cambiar al ambiente especificado',
  })
  async switchEnvironment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SwitchEnvironmentDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.switchEnvironment(
      user.tenantId,
      dto.environment,
    );
  }

  // Dynamic route MUST come after static routes to avoid matching test-connection, renew-token, etc.
  @Post('config/:environment')
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Configurar ambiente (TEST o PRODUCTION)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['certificate', 'apiUser', 'apiPassword', 'certificatePassword'],
      properties: {
        certificate: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de certificado .p12 o .pfx',
        },
        apiUser: {
          type: 'string',
          description: 'Usuario de API de Hacienda',
        },
        apiPassword: {
          type: 'string',
          description: 'Contraseña de API de Hacienda',
        },
        certificatePassword: {
          type: 'string',
          description: 'Contraseña del certificado',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ambiente configurado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la configuración',
  })
  async configureEnvironment(
    @CurrentUser() user: CurrentUserData,
    @Param('environment') environment: string,
    @UploadedFile() certificate: Express.Multer.File,
    @Body() dto: ConfigureEnvironmentDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    if (!['TEST', 'PRODUCTION'].includes(environment)) {
      throw new BadRequestException('Ambiente debe ser TEST o PRODUCTION');
    }

    if (!certificate) {
      throw new BadRequestException('Se requiere el archivo de certificado');
    }

    // Validate file extension
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
      user.tenantId,
      environment as HaciendaEnvironment,
      dto,
      certificate.buffer,
      certificate.originalname,
    );
  }

  // ===== TEST CENTER =====

  @Get('tests/progress')
  @ApiOperation({ summary: 'Obtener progreso de pruebas' })
  @ApiResponse({
    status: 200,
    description: 'Progreso de pruebas',
    type: TestProgressResponseDto,
  })
  async getTestProgress(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.getTestProgress(user.tenantId);
  }

  @Post('tests/execute')
  @ApiOperation({ summary: 'Ejecutar una prueba' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la prueba',
  })
  @ApiResponse({
    status: 400,
    description: 'Error al ejecutar la prueba',
  })
  async executeTest(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ExecuteTestDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.executeTest(user.tenantId, dto);
  }

  @Get('tests/history')
  @ApiOperation({ summary: 'Obtener historial de pruebas' })
  @ApiResponse({
    status: 200,
    description: 'Historial de pruebas',
  })
  async getTestHistory(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetTestHistoryQueryDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.getTestHistory(user.tenantId, {
      dteType: query.dteType,
      status: query.status,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
    });
  }

  @Post('tests/generate-data')
  @ApiOperation({ summary: 'Generar datos de prueba aleatorios' })
  @ApiResponse({
    status: 200,
    description: 'Datos de prueba generados',
  })
  async generateTestData(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GenerateTestDataDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    return this.haciendaService.generateTestDataPreview(
      user.tenantId,
      dto.dteType as any,
    );
  }

  // ===== SUCCESSFUL TESTS FOR CANCELLATION =====

  @Get('tests/successful-emissions')
  @ApiOperation({
    summary: 'Obtener emisiones exitosas para anulación',
    description: 'Lista de DTEs emitidos exitosamente que pueden ser anulados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de emisiones exitosas',
  })
  async getSuccessfulEmissions(
    @CurrentUser() user: CurrentUserData,
    @Query('dteType') dteType?: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Usuario no tiene tenant asignado');
    }

    // Get emissions that haven't been cancelled yet
    const history = await this.haciendaService.getTestHistory(user.tenantId, {
      status: 'SUCCESS',
    });

    // Filter to only emissions
    let emissions = history.filter((r) => r.testType === 'EMISSION');

    if (dteType) {
      emissions = emissions.filter((r) => r.dteType === dteType);
    }

    // Get all cancelled records
    const cancellations = history.filter((r) => r.testType === 'CANCELLATION');
    const cancelledCodes = new Set(
      cancellations
        .map((c) => {
          // The cancellation record references the original DTE
          // We need to check what was cancelled
          return c.codigoGeneracion;
        })
        .filter(Boolean),
    );

    // Filter out already cancelled emissions
    // Note: In a real implementation, we'd track this relationship better
    return emissions.filter((e) => !cancelledCodes.has(e.codigoGeneracion));
  }
}
