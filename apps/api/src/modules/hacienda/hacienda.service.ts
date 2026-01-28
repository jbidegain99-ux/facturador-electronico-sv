import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../email-config/services/encryption.service';
import { CertificateService } from './services/certificate.service';
import { HaciendaAuthService } from './services/hacienda-auth.service';
import { TestDataGeneratorService, EmisorData } from './services/test-data-generator.service';
import {
  HaciendaEnvironment,
  HaciendaConfigResponse,
  EnvironmentConfigResponse,
  TestProgressResponse,
  TestProgressByDte,
  TestRecordResponse,
  ExecuteTestResult,
  DTE_TYPES,
  DteTypeCode,
  TESTS_REQUIRED,
  HACIENDA_URLS,
  HACIENDA_ENDPOINTS,
  HaciendaTestType,
  HaciendaTestStatus,
} from './interfaces';
import { ConfigureEnvironmentDto, ExecuteTestDto, QuickSetupDto, ValidateConnectionDto } from './dto';
import { GeneratedTestData } from './services/test-data-generator.service';
import { HaciendaEnvironmentConfig, HaciendaTestRecord } from '@prisma/client';

@Injectable()
export class HaciendaService {
  private readonly logger = new Logger(HaciendaService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private certificateService: CertificateService,
    private haciendaAuthService: HaciendaAuthService,
    private testDataGenerator: TestDataGeneratorService,
  ) {}

  /**
   * Get or create Hacienda configuration for a tenant
   */
  async getOrCreateConfig(tenantId: string): Promise<HaciendaConfigResponse> {
    let config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
      include: {
        environmentConfigs: true,
        tenant: true,
      },
    });

    if (!config) {
      config = await this.prisma.haciendaConfig.create({
        data: {
          tenantId,
          activeEnvironment: 'TEST',
          testingStatus: 'NOT_STARTED',
          environmentConfigs: {
            create: [
              { environment: 'TEST' },
              { environment: 'PRODUCTION' },
            ],
          },
        },
        include: {
          environmentConfigs: true,
          tenant: true,
        },
      });
    }

    const testConfig = config.environmentConfigs.find(
      (ec: HaciendaEnvironmentConfig) => ec.environment === 'TEST',
    );
    const prodConfig = config.environmentConfigs.find(
      (ec: HaciendaEnvironmentConfig) => ec.environment === 'PRODUCTION',
    );

    return {
      activeEnvironment: config.activeEnvironment as HaciendaEnvironment,
      testingStatus: config.testingStatus as any,
      testingStartedAt: config.testingStartedAt || undefined,
      testingCompletedAt: config.testingCompletedAt || undefined,
      productionAuthorizedAt: config.productionAuthorizedAt || undefined,
      testConfig: testConfig
        ? this.formatEnvironmentConfig(testConfig, 'TEST')
        : null,
      prodConfig: prodConfig
        ? this.formatEnvironmentConfig(prodConfig, 'PRODUCTION')
        : null,
    };
  }

  /**
   * Configure an environment with credentials and certificate
   */
  async configureEnvironment(
    tenantId: string,
    environment: HaciendaEnvironment,
    dto: ConfigureEnvironmentDto,
    certificateBuffer: Buffer,
    certificateFileName: string,
  ): Promise<{ success: boolean; message: string; certificateInfo?: any }> {
    // Validate certificate
    const validation = await this.certificateService.validateCertificate(
      certificateBuffer,
      dto.certificatePassword,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    // Ensure config exists
    await this.getOrCreateConfig(tenantId);

    // Find or create environment config
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Configuración de Hacienda no encontrada');
    }

    let envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfigId: config.id,
        environment,
      },
    });

    if (!envConfig) {
      envConfig = await this.prisma.haciendaEnvironmentConfig.create({
        data: {
          haciendaConfigId: config.id,
          environment,
        },
      });
    }

    // Update environment config with encrypted credentials
    await this.prisma.haciendaEnvironmentConfig.update({
      where: { id: envConfig.id },
      data: {
        apiUser: dto.apiUser,
        apiPasswordEncrypted: this.encryptionService.encrypt(dto.apiPassword),
        certificateP12: certificateBuffer,
        certificateFileName,
        certificatePasswordEnc: this.encryptionService.encrypt(
          dto.certificatePassword,
        ),
        certificateValidUntil: validation.info.validTo,
        certificateNit: validation.info.nit,
        certificateSubject: validation.info.subject,
        isConfigured: true,
        isValidated: false, // Will be validated on connection test
        lastValidationError: null,
      },
    });

    // Update testing status if needed
    if (environment === 'TEST' && config.testingStatus === 'NOT_STARTED') {
      await this.prisma.haciendaConfig.update({
        where: { id: config.id },
        data: {
          testingStatus: 'IN_PROGRESS',
          testingStartedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Environment ${environment} configured for tenant ${tenantId}`,
    );

    return {
      success: true,
      message: `Ambiente ${environment} configurado exitosamente`,
      certificateInfo: {
        fileName: certificateFileName,
        validUntil: validation.info.validTo,
        nit: validation.info.nit,
        subject: validation.info.subject,
      },
    };
  }

  /**
   * Quick setup for companies that already have credentials
   * Configures environment and validates connection in a single operation
   */
  async quickSetup(
    tenantId: string,
    dto: QuickSetupDto,
    certificateBuffer: Buffer,
    certificateFileName: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      environment: HaciendaEnvironment;
      certificate: {
        valid: boolean;
        nit: string | null;
        expiresAt: Date;
        subject: string;
        daysUntilExpiry: number;
      };
      authentication: {
        valid: boolean;
        tokenExpiresAt: Date;
      };
    };
    errors?: { field: string; message: string }[];
  }> {
    const errors: { field: string; message: string }[] = [];

    // Step 1: Validate certificate
    this.logger.log(`Quick setup: Validating certificate for tenant ${tenantId}`);
    const certValidation = await this.certificateService.validateCertificate(
      certificateBuffer,
      dto.certificatePassword,
    );

    if (!certValidation.valid) {
      errors.push({
        field: 'certificate',
        message: certValidation.message,
      });
      return {
        success: false,
        message: 'Error de validación',
        errors,
      };
    }

    // Calculate days until certificate expiry
    const daysUntilExpiry = this.certificateService.getDaysUntilExpiry(
      certValidation.info.validTo,
    );

    // Step 2: Get tenant info for authentication
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      errors.push({
        field: 'tenant',
        message: 'Empresa no encontrada',
      });
      return {
        success: false,
        message: 'Error de validación',
        errors,
      };
    }

    // Step 3: Validate API credentials (authenticate without saving)
    this.logger.log(`Quick setup: Validating API credentials for tenant ${tenantId}`);
    const authValidation = await this.haciendaAuthService.validateCredentials(
      dto.apiUser,
      dto.apiPassword,
      dto.environment,
    );

    if (!authValidation.valid) {
      errors.push({
        field: 'authentication',
        message: authValidation.message,
      });
      return {
        success: false,
        message: 'Error de validación',
        errors,
      };
    }

    // Step 4: All validations passed - now save the configuration
    this.logger.log(`Quick setup: Saving configuration for tenant ${tenantId}`);

    // Ensure config exists
    await this.getOrCreateConfig(tenantId);

    // Find or create environment config
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new BadRequestException('Configuración de Hacienda no encontrada');
    }

    let envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfigId: config.id,
        environment: dto.environment,
      },
    });

    if (!envConfig) {
      envConfig = await this.prisma.haciendaEnvironmentConfig.create({
        data: {
          haciendaConfigId: config.id,
          environment: dto.environment,
        },
      });
    }

    // Update environment config with encrypted credentials
    await this.prisma.haciendaEnvironmentConfig.update({
      where: { id: envConfig.id },
      data: {
        apiUser: dto.apiUser,
        apiPasswordEncrypted: this.encryptionService.encrypt(dto.apiPassword),
        certificateP12: certificateBuffer,
        certificateFileName,
        certificatePasswordEnc: this.encryptionService.encrypt(dto.certificatePassword),
        certificateValidUntil: certValidation.info.validTo,
        certificateNit: certValidation.info.nit,
        certificateSubject: certValidation.info.subject,
        isConfigured: true,
        isValidated: true, // Already validated through test connection
        lastValidationAt: new Date(),
        lastValidationError: null,
        tokenExpiresAt: authValidation.expiresAt,
        tokenRefreshedAt: new Date(),
      },
    });

    // Update testing status if needed
    if (dto.environment === 'TEST' && config.testingStatus === 'NOT_STARTED') {
      await this.prisma.haciendaConfig.update({
        where: { id: config.id },
        data: {
          testingStatus: 'IN_PROGRESS',
          testingStartedAt: new Date(),
        },
      });
    }

    this.logger.log(`Quick setup completed successfully for tenant ${tenantId}`);

    return {
      success: true,
      message: 'Configuración completada exitosamente',
      data: {
        environment: dto.environment,
        certificate: {
          valid: true,
          nit: certValidation.info.nit,
          expiresAt: certValidation.info.validTo,
          subject: certValidation.info.subject,
          daysUntilExpiry,
        },
        authentication: {
          valid: true,
          tokenExpiresAt: authValidation.expiresAt!,
        },
      },
    };
  }

  /**
   * Validate API connection without saving configuration
   * Useful for testing credentials before committing
   */
  async validateConnection(
    dto: ValidateConnectionDto,
  ): Promise<{
    success: boolean;
    tokenExpiry?: Date;
    error?: string;
  }> {
    try {
      const result = await this.haciendaAuthService.validateCredentials(
        dto.apiUser,
        dto.apiPassword,
        dto.environment,
      );

      if (result.valid) {
        return {
          success: true,
          tokenExpiry: result.expiresAt,
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Test connection to Hacienda
   */
  async testConnection(
    tenantId: string,
    environment: HaciendaEnvironment,
  ): Promise<{ success: boolean; message: string; tokenExpiry?: Date }> {
    const envConfig = await this.getEnvironmentConfig(tenantId, environment);

    if (!envConfig.isConfigured) {
      throw new BadRequestException(
        `El ambiente ${environment} no está configurado`,
      );
    }

    try {
      const tokenInfo = await this.haciendaAuthService.getTokenForTenant(
        tenantId,
        environment,
      );

      // Update validation status
      await this.prisma.haciendaEnvironmentConfig.update({
        where: { id: envConfig.id },
        data: {
          isValidated: true,
          lastValidationAt: new Date(),
          lastValidationError: null,
          tokenExpiresAt: tokenInfo.expiresAt,
          tokenRefreshedAt: tokenInfo.obtainedAt,
        },
      });

      return {
        success: true,
        message: 'Conexión exitosa con Ministerio de Hacienda',
        tokenExpiry: tokenInfo.expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      // Update validation error
      await this.prisma.haciendaEnvironmentConfig.update({
        where: { id: envConfig.id },
        data: {
          isValidated: false,
          lastValidationAt: new Date(),
          lastValidationError: errorMessage,
        },
      });

      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Renew authentication token
   */
  async renewToken(
    tenantId: string,
    environment: HaciendaEnvironment,
  ): Promise<{ success: boolean; expiresAt: Date }> {
    const tokenInfo = await this.haciendaAuthService.refreshToken(
      tenantId,
      environment,
    );

    return {
      success: true,
      expiresAt: tokenInfo.expiresAt,
    };
  }

  /**
   * Switch active environment
   */
  async switchEnvironment(
    tenantId: string,
    environment: HaciendaEnvironment,
  ): Promise<{ success: boolean }> {
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
      include: { environmentConfigs: true },
    });

    if (!config) {
      throw new NotFoundException('Configuración de Hacienda no encontrada');
    }

    // Verify environment is configured and validated
    const envConfig = config.environmentConfigs.find(
      (ec: HaciendaEnvironmentConfig) => ec.environment === environment,
    );

    if (!envConfig || !envConfig.isConfigured) {
      throw new BadRequestException(
        `El ambiente ${environment} no está configurado`,
      );
    }

    if (!envConfig.isValidated) {
      throw new BadRequestException(
        `El ambiente ${environment} no ha sido validado. Ejecute una prueba de conexión primero.`,
      );
    }

    // For production, require authorized status
    if (
      environment === 'PRODUCTION' &&
      config.testingStatus !== 'AUTHORIZED'
    ) {
      throw new BadRequestException(
        'No puede cambiar a producción sin completar el proceso de acreditación',
      );
    }

    await this.prisma.haciendaConfig.update({
      where: { id: config.id },
      data: { activeEnvironment: environment },
    });

    this.logger.log(
      `Switched to ${environment} environment for tenant ${tenantId}`,
    );

    return { success: true };
  }

  /**
   * Get test progress
   */
  async getTestProgress(tenantId: string): Promise<TestProgressResponse> {
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
      include: {
        testRecords: {
          where: { status: 'SUCCESS' },
        },
      },
    });

    if (!config) {
      return {
        progress: [],
        totalRequired: 0,
        totalCompleted: 0,
        percentComplete: 0,
        canRequestAuthorization: false,
      };
    }

    // Count completed tests by type
    const completedByType = new Map<string, { emission: number; cancellation: number }>();

    for (const record of config.testRecords) {
      const key = record.dteType;
      if (!completedByType.has(key)) {
        completedByType.set(key, { emission: 0, cancellation: 0 });
      }
      const counts = completedByType.get(key)!;
      if (record.testType === 'EMISSION') {
        counts.emission++;
      } else if (record.testType === 'CANCELLATION') {
        counts.cancellation++;
      }
    }

    // Build progress for each DTE type
    const progress: TestProgressByDte[] = Object.entries(TESTS_REQUIRED).map(
      ([dteType, required]) => {
        const completed = completedByType.get(dteType) || {
          emission: 0,
          cancellation: 0,
        };
        return {
          dteType: dteType as DteTypeCode,
          dteName: DTE_TYPES[dteType as DteTypeCode],
          emissionRequired: required.emission,
          emissionCompleted: Math.min(completed.emission, required.emission),
          cancellationRequired: required.cancellation,
          cancellationCompleted: Math.min(
            completed.cancellation,
            required.cancellation,
          ),
          isComplete:
            completed.emission >= required.emission &&
            completed.cancellation >= required.cancellation,
        };
      },
    );

    // Calculate totals
    const totalRequired = progress.reduce(
      (sum, p) => sum + p.emissionRequired + p.cancellationRequired,
      0,
    );
    const totalCompleted = progress.reduce(
      (sum, p) => sum + p.emissionCompleted + p.cancellationCompleted,
      0,
    );
    const percentComplete =
      totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
    const canRequestAuthorization = progress.every((p) => p.isComplete);

    // Calculate days remaining (60 days from start)
    let daysRemaining: number | undefined;
    if (config.testingStartedAt) {
      const deadline = new Date(config.testingStartedAt);
      deadline.setDate(deadline.getDate() + 60);
      const now = new Date();
      daysRemaining = Math.max(
        0,
        Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }

    return {
      progress,
      totalRequired,
      totalCompleted,
      percentComplete,
      canRequestAuthorization,
      daysRemaining,
      testingStartedAt: config.testingStartedAt || undefined,
    };
  }

  /**
   * Execute a test
   */
  async executeTest(
    tenantId: string,
    dto: ExecuteTestDto,
  ): Promise<ExecuteTestResult> {
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
      include: {
        tenant: true,
        environmentConfigs: {
          where: { environment: 'TEST' },
        },
      },
    });

    if (!config) {
      throw new NotFoundException('Configuración de Hacienda no encontrada');
    }

    const testConfig = config.environmentConfigs[0];
    if (!testConfig || !testConfig.isConfigured) {
      throw new BadRequestException(
        'El ambiente de pruebas no está configurado',
      );
    }

    if (!testConfig.isValidated) {
      throw new BadRequestException(
        'El ambiente de pruebas no ha sido validado. Ejecute una prueba de conexión primero.',
      );
    }

    // Get token
    const tokenInfo = await this.haciendaAuthService.getTokenForTenant(
      tenantId,
      'TEST',
    );

    // Get certificate for signing
    if (!testConfig.certificateP12 || !testConfig.certificatePasswordEnc) {
      throw new BadRequestException('Certificado no configurado');
    }

    const certificatePassword = this.encryptionService.decrypt(
      testConfig.certificatePasswordEnc,
    );

    // Build emisor data from tenant
    const emisor: EmisorData = {
      nit: config.tenant.nit,
      nrc: config.tenant.nrc,
      nombre: config.tenant.nombre,
      codActividad: config.tenant.actividadEcon,
      descActividad: 'Actividad económica',
      nombreComercial: config.tenant.nombreComercial,
      tipoEstablecimiento: '01',
      direccion: JSON.parse(config.tenant.direccion),
      telefono: config.tenant.telefono,
      correo: config.tenant.correo,
      codEstableMH: null,
      codEstable: null,
      codPuntoVentaMH: null,
      codPuntoVenta: null,
    };

    let testRecord: any;

    if (dto.testType === 'EMISSION') {
      testRecord = await this.executeEmissionTest(
        config.id,
        dto.dteType,
        emisor,
        tokenInfo.token,
        Buffer.from(testConfig.certificateP12),
        certificatePassword,
      );
    } else if (dto.testType === 'CANCELLATION') {
      if (!dto.codigoGeneracionToCancel) {
        throw new BadRequestException(
          'Se requiere el código de generación del DTE a anular',
        );
      }
      testRecord = await this.executeCancellationTest(
        config.id,
        dto.dteType,
        dto.codigoGeneracionToCancel,
        emisor,
        tokenInfo.token,
        Buffer.from(testConfig.certificateP12),
        certificatePassword,
      );
    } else {
      throw new BadRequestException('Tipo de prueba no soportado');
    }

    // Get updated progress
    const progress = await this.getTestProgress(tenantId);

    return {
      success: testRecord.status === 'SUCCESS',
      testRecord: {
        id: testRecord.id,
        dteType: testRecord.dteType as DteTypeCode,
        testType: testRecord.testType as HaciendaTestType,
        status: testRecord.status as HaciendaTestStatus,
        codigoGeneracion: testRecord.codigoGeneracion || undefined,
        selloRecibido: testRecord.selloRecibido || undefined,
        errorMessage: testRecord.errorMessage || undefined,
        executedAt: testRecord.executedAt,
      },
      progress,
    };
  }

  /**
   * Execute emission test
   */
  private async executeEmissionTest(
    configId: string,
    dteType: DteTypeCode,
    emisor: EmisorData,
    token: string,
    certificateBuffer: Buffer,
    certificatePassword: string,
  ): Promise<any> {
    // Get next correlativo
    const existingRecords = await this.prisma.haciendaTestRecord.count({
      where: {
        haciendaConfigId: configId,
        dteType,
        testType: 'EMISSION',
      },
    });
    const correlativo = existingRecords + 1;

    // Generate test data
    const testData = this.testDataGenerator.generateTestData(
      dteType,
      emisor,
      correlativo,
    );

    let status: HaciendaTestStatus = 'PENDING';
    let selloRecibido: string | null = null;
    let errorMessage: string | null = null;
    let responsePayload: string | null = null;

    try {
      // Sign the DTE
      const jws = await this.certificateService.signPayload(
        certificateBuffer,
        certificatePassword,
        testData,
      );

      // Send to Hacienda
      const baseUrl = HACIENDA_URLS.TEST;
      const url = `${baseUrl}${HACIENDA_ENDPOINTS.RECEPCION_DTE}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          ambiente: '00', // Test
          idEnvio: Date.now(),
          version: testData.identificacion.version,
          tipoDte: dteType,
          documento: jws,
        }),
      });

      const result = await response.json();
      responsePayload = JSON.stringify(result);

      if (result.estado === 'PROCESADO') {
        status = 'SUCCESS';
        selloRecibido = result.selloRecibido;
        this.logger.log(
          `Emission test successful for DTE ${dteType}: ${selloRecibido}`,
        );
      } else {
        status = 'FAILED';
        errorMessage =
          result.descripcionMsg ||
          result.observaciones?.join(', ') ||
          'Error desconocido';
        this.logger.warn(
          `Emission test failed for DTE ${dteType}: ${errorMessage}`,
        );
      }
    } catch (error) {
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Emission test error: ${errorMessage}`);
    }

    // Save test record
    const record = await this.prisma.haciendaTestRecord.create({
      data: {
        haciendaConfigId: configId,
        dteType,
        testType: 'EMISSION',
        status,
        codigoGeneracion: testData.identificacion.codigoGeneracion,
        selloRecibido,
        requestPayload: JSON.stringify(testData),
        responsePayload,
        errorMessage,
      },
    });

    return record;
  }

  /**
   * Execute cancellation test
   */
  private async executeCancellationTest(
    configId: string,
    dteType: DteTypeCode,
    codigoGeneracionToCancel: string,
    emisor: EmisorData,
    token: string,
    certificateBuffer: Buffer,
    certificatePassword: string,
  ): Promise<any> {
    // Find the original test record
    const originalRecord = await this.prisma.haciendaTestRecord.findFirst({
      where: {
        haciendaConfigId: configId,
        codigoGeneracion: codigoGeneracionToCancel,
        status: 'SUCCESS',
        testType: 'EMISSION',
      },
    });

    if (!originalRecord || !originalRecord.selloRecibido) {
      throw new BadRequestException(
        'No se encontró el DTE original o no tiene sello de recepción',
      );
    }

    // Parse original request to get details
    const originalData = JSON.parse(originalRecord.requestPayload || '{}');

    // Generate cancellation data
    const cancellationData = this.testDataGenerator.generateCancellationData(
      {
        codigoGeneracion: originalRecord.codigoGeneracion!,
        selloRecibido: originalRecord.selloRecibido,
        tipoDte: dteType,
        numeroControl: originalData.identificacion?.numeroControl || '',
        fecEmi: originalData.identificacion?.fecEmi || '',
      },
      emisor,
    );

    let status: HaciendaTestStatus = 'PENDING';
    let selloRecibido: string | null = null;
    let errorMessage: string | null = null;
    let responsePayload: string | null = null;

    try {
      // Sign the cancellation document
      const jws = await this.certificateService.signPayload(
        certificateBuffer,
        certificatePassword,
        cancellationData,
      );

      // Send to Hacienda
      const baseUrl = HACIENDA_URLS.TEST;
      const url = `${baseUrl}${HACIENDA_ENDPOINTS.ANULAR_DTE}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          ambiente: '00', // Test
          idEnvio: Date.now(),
          version: 2,
          documento: jws,
        }),
      });

      const result = await response.json();
      responsePayload = JSON.stringify(result);

      if (result.estado === 'PROCESADO') {
        status = 'SUCCESS';
        selloRecibido = result.selloRecibido;
        this.logger.log(
          `Cancellation test successful for DTE ${dteType}: ${selloRecibido}`,
        );
      } else {
        status = 'FAILED';
        errorMessage =
          result.descripcionMsg ||
          result.observaciones?.join(', ') ||
          'Error desconocido';
        this.logger.warn(
          `Cancellation test failed for DTE ${dteType}: ${errorMessage}`,
        );
      }
    } catch (error) {
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Cancellation test error: ${errorMessage}`);
    }

    // Save test record
    const record = await this.prisma.haciendaTestRecord.create({
      data: {
        haciendaConfigId: configId,
        dteType,
        testType: 'CANCELLATION',
        status,
        codigoGeneracion: (cancellationData as any).identificacion?.codigoGeneracion,
        selloRecibido,
        requestPayload: JSON.stringify(cancellationData),
        responsePayload,
        errorMessage,
      },
    });

    return record;
  }

  /**
   * Get test history
   */
  async getTestHistory(
    tenantId: string,
    filters: {
      dteType?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<TestRecordResponse[]> {
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return [];
    }

    const where: any = {
      haciendaConfigId: config.id,
    };

    if (filters.dteType) {
      where.dteType = filters.dteType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const records = await this.prisma.haciendaTestRecord.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return records.map((record: HaciendaTestRecord) => ({
      id: record.id,
      dteType: record.dteType as DteTypeCode,
      dteName: DTE_TYPES[record.dteType as DteTypeCode] || record.dteType,
      testType: record.testType as HaciendaTestType,
      status: record.status as HaciendaTestStatus,
      codigoGeneracion: record.codigoGeneracion || undefined,
      selloRecibido: record.selloRecibido || undefined,
      errorMessage: record.errorMessage || undefined,
      executedAt: record.executedAt,
    }));
  }

  /**
   * Generate test data preview
   */
  async generateTestDataPreview(
    tenantId: string,
    dteType: DteTypeCode,
  ): Promise<GeneratedTestData> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const emisor: EmisorData = {
      nit: tenant.nit,
      nrc: tenant.nrc,
      nombre: tenant.nombre,
      codActividad: tenant.actividadEcon,
      descActividad: 'Actividad económica',
      nombreComercial: tenant.nombreComercial,
      tipoEstablecimiento: '01',
      direccion: JSON.parse(tenant.direccion),
      telefono: tenant.telefono,
      correo: tenant.correo,
      codEstableMH: null,
      codEstable: null,
      codPuntoVentaMH: null,
      codPuntoVenta: null,
    };

    return this.testDataGenerator.generateTestData(dteType, emisor, 1);
  }

  /**
   * Get environment config helper
   */
  private async getEnvironmentConfig(
    tenantId: string,
    environment: HaciendaEnvironment,
  ) {
    const config = await this.prisma.haciendaConfig.findUnique({
      where: { tenantId },
      include: { environmentConfigs: true },
    });

    if (!config) {
      throw new NotFoundException('Configuración de Hacienda no encontrada');
    }

    const envConfig = config.environmentConfigs.find(
      (ec: HaciendaEnvironmentConfig) => ec.environment === environment,
    );

    if (!envConfig) {
      throw new NotFoundException(
        `Configuración del ambiente ${environment} no encontrada`,
      );
    }

    return envConfig;
  }

  /**
   * Format environment config for response
   */
  private formatEnvironmentConfig(
    envConfig: any,
    environment: HaciendaEnvironment,
  ): EnvironmentConfigResponse {
    return {
      environment,
      isConfigured: envConfig.isConfigured,
      isValidated: envConfig.isValidated,
      tokenExpiry: envConfig.tokenExpiresAt || undefined,
      certificateInfo: envConfig.certificateFileName
        ? {
            fileName: envConfig.certificateFileName,
            validUntil: envConfig.certificateValidUntil,
            nit: envConfig.certificateNit,
            subject: envConfig.certificateSubject || '',
          }
        : undefined,
      lastValidationAt: envConfig.lastValidationAt || undefined,
      lastValidationError: envConfig.lastValidationError || undefined,
    };
  }
}
