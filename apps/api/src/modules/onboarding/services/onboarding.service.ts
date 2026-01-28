import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services';
import {
  OnboardingStep,
  OnboardingStatus,
  StepStatus,
  PerformedBy,
  AssistanceLevel,
  DteType,
  DteTypeSelection,
} from '../types/onboarding.types';
import {
  StartOnboardingDto,
  UpdateCompanyInfoDto,
  SetHaciendaCredentialsDto,
  SetDteTypesDto,
  UploadTestCertificateDto,
  UploadProdCertificateDto,
  SetApiCredentialsDto,
  CompleteStepDto,
  GoToStepDto,
} from '../dto';

// Step order and metadata
const STEP_ORDER: OnboardingStep[] = [
  'WELCOME',
  'COMPANY_INFO',
  'HACIENDA_CREDENTIALS',
  'DTE_TYPE_SELECTION',
  'TEST_ENVIRONMENT_REQUEST',
  'TEST_CERTIFICATE',
  'API_CREDENTIALS_TEST',
  'EXECUTE_TESTS',
  'REQUEST_AUTHORIZATION',
  'PROD_CERTIFICATE',
  'API_CREDENTIALS_PROD',
  'FINAL_VALIDATION',
  'COMPLETED',
];

const STEP_METADATA: Record<OnboardingStep, { name: string; description: string }> = {
  WELCOME: {
    name: 'Bienvenida',
    description: 'Introducción al proceso de autorización como emisor',
  },
  COMPANY_INFO: {
    name: 'Información de la Empresa',
    description: 'Datos del contribuyente para registro en Hacienda',
  },
  HACIENDA_CREDENTIALS: {
    name: 'Credenciales de Hacienda',
    description: 'Verificar acceso a Servicios en Línea del MH',
  },
  DTE_TYPE_SELECTION: {
    name: 'Tipos de DTE',
    description: 'Seleccionar los documentos tributarios a emitir',
  },
  TEST_ENVIRONMENT_REQUEST: {
    name: 'Ambiente de Pruebas',
    description: 'Solicitar acceso al ambiente de pruebas del MH',
  },
  TEST_CERTIFICATE: {
    name: 'Certificado de Pruebas',
    description: 'Generar y configurar certificado digital de pruebas',
  },
  API_CREDENTIALS_TEST: {
    name: 'API Pruebas',
    description: 'Configurar credenciales de API para el ambiente de pruebas',
  },
  EXECUTE_TESTS: {
    name: 'Ejecutar Pruebas',
    description: 'Realizar las pruebas técnicas requeridas por Hacienda',
  },
  REQUEST_AUTHORIZATION: {
    name: 'Solicitar Autorización',
    description: 'Enviar solicitud de autorización como emisor',
  },
  PROD_CERTIFICATE: {
    name: 'Certificado Productivo',
    description: 'Generar certificado digital para producción',
  },
  API_CREDENTIALS_PROD: {
    name: 'API Producción',
    description: 'Configurar credenciales de API para producción',
  },
  FINAL_VALIDATION: {
    name: 'Validación Final',
    description: 'Verificar configuración completa del sistema',
  },
  COMPLETED: {
    name: 'Completado',
    description: '¡Felicidades! Ya puede emitir documentos electrónicos',
  },
};

// Required tests per DTE type
const TESTS_REQUIRED: Record<DteType, number> = {
  FACTURA: 5,
  CREDITO_FISCAL: 3,
  NOTA_REMISION: 2,
  NOTA_CREDITO: 2,
  NOTA_DEBITO: 2,
  COMPROBANTE_RETENCION: 2,
  COMPROBANTE_LIQUIDACION: 2,
  DOCUMENTO_CONTABLE_LIQUIDACION: 1,
  FACTURA_EXPORTACION: 2,
  FACTURA_SUJETO_EXCLUIDO: 2,
  COMPROBANTE_DONACION: 1,
};

const EVENTS_REQUIRED = {
  ANULACION: 2,
  CONTINGENCIA: 1,
  INVALIDACION: 1,
};

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // =========================================================================
  // GET ONBOARDING STATE
  // =========================================================================

  async getOnboarding(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: {
        dteTypes: true,
        steps: true,
        testProgress: true,
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!onboarding) {
      return null;
    }

    return this.formatOnboardingResponse(onboarding);
  }

  async getProgress(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: { steps: true },
    });

    if (!onboarding) {
      return {
        hasStarted: false,
        currentStep: 'WELCOME',
        overallStatus: 'NOT_STARTED',
        completedSteps: 0,
        totalSteps: STEP_ORDER.length,
        percentComplete: 0,
        steps: this.getDefaultStepsList(),
      };
    }

    const completedCount = onboarding.steps.filter(
      (s) => s.status === 'COMPLETED',
    ).length;

    return {
      hasStarted: true,
      currentStep: onboarding.currentStep,
      overallStatus: onboarding.overallStatus,
      completedSteps: completedCount,
      totalSteps: STEP_ORDER.length,
      percentComplete: Math.round((completedCount / STEP_ORDER.length) * 100),
      steps: this.buildStepsList(onboarding),
      canProceed: this.canProceedToNextStep(onboarding),
      nextAction: this.getNextAction(onboarding),
    };
  }

  // =========================================================================
  // START / INITIALIZE ONBOARDING
  // =========================================================================

  async startOnboarding(tenantId: string, dto: StartOnboardingDto, userId: string) {
    // Check if already exists - if so, return the existing onboarding
    const existing = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: {
        dteTypes: true,
        steps: true,
        testProgress: true,
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (existing) {
      // Return existing onboarding instead of error
      return this.formatOnboardingResponse(existing);
    }

    // Get tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Create onboarding record
    const onboarding = await this.prisma.tenantOnboarding.create({
      data: {
        tenantId,
        currentStep: 'WELCOME',
        overallStatus: 'IN_PROGRESS',
        assistanceLevel: dto.assistanceLevel,
        // Pre-fill from tenant if available
        nit: tenant.nit,
        nrc: tenant.nrc,
        razonSocial: tenant.nombre,
        emailHacienda: tenant.correo,
        telefonoHacienda: tenant.telefono,
        // Create initial step record
        steps: {
          create: {
            step: 'WELCOME',
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            performedBy: PerformedBy.TENANT,
            performedById: userId,
          },
        },
      },
      include: {
        steps: true,
      },
    });

    return this.formatOnboardingResponse(onboarding);
  }

  // =========================================================================
  // STEP: COMPANY INFO
  // =========================================================================

  async updateCompanyInfo(
    tenantId: string,
    dto: UpdateCompanyInfoDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Update company info
    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        nit: dto.nit,
        nrc: dto.nrc,
        razonSocial: dto.razonSocial,
        nombreComercial: dto.nombreComercial,
        actividadEconomica: dto.actividadEconomica,
        emailHacienda: dto.emailHacienda,
        telefonoHacienda: dto.telefonoHacienda,
      },
      include: { steps: true },
    });

    // Update step record
    await this.upsertStepRecord(onboarding.id, 'COMPANY_INFO', {
      status: 'COMPLETED',
      stepData: JSON.stringify(dto),
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  // =========================================================================
  // STEP: HACIENDA CREDENTIALS
  // =========================================================================

  async setHaciendaCredentials(
    tenantId: string,
    dto: SetHaciendaCredentialsDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Encrypt password
    const encryptedPassword = this.encryptionService.encrypt(dto.haciendaPassword);

    // Update credentials
    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        haciendaUser: dto.haciendaUser,
        haciendaPassword: encryptedPassword,
      },
      include: { steps: true },
    });

    // Update step record
    await this.upsertStepRecord(onboarding.id, 'HACIENDA_CREDENTIALS', {
      status: 'COMPLETED',
      stepData: JSON.stringify({ haciendaUser: dto.haciendaUser }),
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  // =========================================================================
  // STEP: DTE TYPE SELECTION
  // =========================================================================

  async setDteTypes(tenantId: string, dto: SetDteTypesDto, userId: string) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Delete existing selections
    await this.prisma.dteTypeSelection.deleteMany({
      where: { onboardingId: onboarding.id },
    });

    // Create new selections
    await this.prisma.dteTypeSelection.createMany({
      data: dto.dteTypes.map((item) => ({
        onboardingId: onboarding.id,
        dteType: item.dteType,
        isRequired: item.isRequired ?? true,
      })),
    });

    // Initialize test progress
    await this.initializeTestProgress(onboarding.id, dto.dteTypes.map((d) => d.dteType));

    // Update step record
    await this.upsertStepRecord(onboarding.id, 'DTE_TYPE_SELECTION', {
      status: 'COMPLETED',
      stepData: JSON.stringify({ dteTypes: dto.dteTypes }),
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    const updated = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: { dteTypes: true, steps: true, testProgress: true },
    });

    return this.formatOnboardingResponse(updated!);
  }

  async getDteTypes(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: { dteTypes: true, testProgress: true },
    });

    if (!onboarding) {
      return { selected: [], available: this.getAvailableDteTypes() };
    }

    const testProgress = onboarding.testProgress
      ? {
          testsCompleted: JSON.parse(onboarding.testProgress.testsCompleted || '{}'),
        }
      : { testsCompleted: {} };

    return {
      selected: onboarding.dteTypes.map((dt) => ({
        dteType: dt.dteType,
        isRequired: dt.isRequired,
        testCompleted: dt.testCompleted,
        testCompletedAt: dt.testCompletedAt,
        testsRequired: TESTS_REQUIRED[dt.dteType as DteType] || 1,
        testsCompleted: testProgress.testsCompleted[dt.dteType] || 0,
      })),
      available: this.getAvailableDteTypes(),
    };
  }

  // =========================================================================
  // STEP: TEST/PROD CERTIFICATES
  // =========================================================================

  async uploadTestCertificate(
    tenantId: string,
    dto: UploadTestCertificateDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Determine upload mode and prepare data
    const isSeparateMode = dto.uploadMode === 'separate' && dto.privateKey;

    // For separate mode, store certificate and private key as JSON
    // For combined mode (.p12/.pfx), store directly
    let certificateData: string;
    let encryptedPassword: string | null = null;

    if (isSeparateMode) {
      // Store both public cert and private key in a JSON structure
      const certJson = JSON.stringify({
        mode: 'separate',
        publicCertificate: dto.certificate,
        privateKey: dto.privateKey,
      });
      certificateData = certJson;
      // Encrypt password if provided (for encrypted private keys)
      if (dto.password) {
        encryptedPassword = this.encryptionService.encrypt(dto.password);
      }
    } else {
      // Combined mode (.p12/.pfx)
      certificateData = dto.certificate;
      encryptedPassword = dto.password
        ? this.encryptionService.encrypt(dto.password)
        : null;
    }

    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        testCertificate: certificateData,
        testCertPassword: encryptedPassword,
        testCertExpiry: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      include: { steps: true },
    });

    await this.upsertStepRecord(onboarding.id, 'TEST_CERTIFICATE', {
      status: 'COMPLETED',
      stepData: JSON.stringify({
        expiryDate: dto.expiryDate,
        uploadMode: dto.uploadMode || 'combined',
      }),
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  async uploadProdCertificate(
    tenantId: string,
    dto: UploadProdCertificateDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Determine upload mode and prepare data
    const isSeparateMode = dto.uploadMode === 'separate' && dto.privateKey;

    let certificateData: string;
    let encryptedPassword: string | null = null;

    if (isSeparateMode) {
      const certJson = JSON.stringify({
        mode: 'separate',
        publicCertificate: dto.certificate,
        privateKey: dto.privateKey,
      });
      certificateData = certJson;
      if (dto.password) {
        encryptedPassword = this.encryptionService.encrypt(dto.password);
      }
    } else {
      certificateData = dto.certificate;
      encryptedPassword = dto.password
        ? this.encryptionService.encrypt(dto.password)
        : null;
    }

    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        prodCertificate: certificateData,
        prodCertPassword: encryptedPassword,
        prodCertExpiry: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      include: { steps: true },
    });

    await this.upsertStepRecord(onboarding.id, 'PROD_CERTIFICATE', {
      status: 'COMPLETED',
      stepData: JSON.stringify({
        expiryDate: dto.expiryDate,
        uploadMode: dto.uploadMode || 'combined',
      }),
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  // =========================================================================
  // STEP: API CREDENTIALS
  // =========================================================================

  async setTestApiCredentials(
    tenantId: string,
    dto: SetApiCredentialsDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    const encryptedPassword = this.encryptionService.encrypt(dto.apiPassword);

    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        testApiPassword: encryptedPassword,
        testEnvironmentUrl:
          dto.environmentUrl || 'https://apitest.dtes.mh.gob.sv',
      },
      include: { steps: true },
    });

    await this.upsertStepRecord(onboarding.id, 'API_CREDENTIALS_TEST', {
      status: 'COMPLETED',
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  async setProdApiCredentials(
    tenantId: string,
    dto: SetApiCredentialsDto,
    userId: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    const encryptedPassword = this.encryptionService.encrypt(dto.apiPassword);

    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: {
        prodApiPassword: encryptedPassword,
        prodEnvironmentUrl: dto.environmentUrl || 'https://api.dtes.mh.gob.sv',
      },
      include: { steps: true },
    });

    await this.upsertStepRecord(onboarding.id, 'API_CREDENTIALS_PROD', {
      status: 'COMPLETED',
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    return this.formatOnboardingResponse(updated);
  }

  // =========================================================================
  // STEP NAVIGATION
  // =========================================================================

  async completeStep(tenantId: string, dto: CompleteStepDto, userId: string) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Complete the step
    await this.upsertStepRecord(onboarding.id, dto.step, {
      status: 'COMPLETED',
      stepData: dto.stepData ? JSON.stringify(dto.stepData) : undefined,
      notes: dto.notes,
      performedBy: PerformedBy.TENANT,
      performedById: userId,
      completedAt: new Date(),
    });

    // Move to next step
    const currentIndex = STEP_ORDER.indexOf(dto.step);
    const nextStep = STEP_ORDER[currentIndex + 1];

    if (nextStep) {
      await this.prisma.tenantOnboarding.update({
        where: { tenantId },
        data: { currentStep: nextStep },
      });

      // Start next step record
      await this.upsertStepRecord(onboarding.id, nextStep, {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });
    } else {
      // Completed all steps
      await this.prisma.tenantOnboarding.update({
        where: { tenantId },
        data: {
          currentStep: 'COMPLETED',
          overallStatus: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: { steps: true },
    });

    return this.formatOnboardingResponse(updated!);
  }

  async goToStep(tenantId: string, dto: GoToStepDto) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    // Verify step is accessible (completed previously or is current)
    const targetIndex = STEP_ORDER.indexOf(dto.step);
    const currentIndex = STEP_ORDER.indexOf(onboarding.currentStep as OnboardingStep);

    if (targetIndex > currentIndex) {
      throw new BadRequestException(
        'No puede avanzar a un paso que aún no ha alcanzado',
      );
    }

    const updated = await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: { currentStep: dto.step },
      include: { steps: true },
    });

    return this.formatOnboardingResponse(updated);
  }

  // =========================================================================
  // ADMIN OPERATIONS
  // =========================================================================

  async getAll(status?: OnboardingStatus) {
    const where = status ? { overallStatus: status } : {};

    const onboardings = await this.prisma.tenantOnboarding.findMany({
      where,
      include: {
        tenant: { select: { id: true, nombre: true, nit: true } },
        steps: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return onboardings.map((o) => ({
      id: o.id,
      tenantId: o.tenantId,
      tenantName: o.tenant.nombre,
      tenantNit: o.tenant.nit,
      currentStep: o.currentStep,
      overallStatus: o.overallStatus,
      assistanceLevel: o.assistanceLevel,
      completedSteps: o.steps.filter((s) => s.status === 'COMPLETED').length,
      totalSteps: STEP_ORDER.length,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  async adminUpdateStep(
    tenantId: string,
    step: OnboardingStep,
    status: StepStatus,
    userId: string,
    notes?: string,
    blockerReason?: string,
  ) {
    const onboarding = await this.getOnboardingOrThrow(tenantId);

    await this.upsertStepRecord(onboarding.id, step, {
      status,
      notes,
      blockerReason,
      performedBy: 'REPUBLICODE',
      performedById: userId,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
    });

    // If blocked, update overall status
    if (status === 'BLOCKED') {
      await this.prisma.tenantOnboarding.update({
        where: { tenantId },
        data: { overallStatus: 'BLOCKED' },
      });
    }

    const updated = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: { steps: true },
    });

    return this.formatOnboardingResponse(updated!);
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private async getOnboardingOrThrow(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException(
        'Proceso de onboarding no encontrado. Inicie el proceso primero.',
      );
    }

    return onboarding;
  }

  private async upsertStepRecord(
    onboardingId: string,
    step: OnboardingStep,
    data: {
      status?: StepStatus;
      stepData?: string;
      notes?: string;
      blockerReason?: string;
      performedBy?: PerformedBy;
      performedById?: string;
      startedAt?: Date;
      completedAt?: Date;
    },
  ) {
    const existing = await this.prisma.onboardingStepRecord.findUnique({
      where: { onboardingId_step: { onboardingId, step } },
    });

    if (existing) {
      return this.prisma.onboardingStepRecord.update({
        where: { id: existing.id },
        data: {
          ...data,
          startedAt: data.startedAt || existing.startedAt,
        },
      });
    }

    return this.prisma.onboardingStepRecord.create({
      data: {
        onboardingId,
        step,
        status: data.status || 'PENDING',
        stepData: data.stepData,
        notes: data.notes,
        blockerReason: data.blockerReason,
        performedBy: data.performedBy,
        performedById: data.performedById,
        startedAt: data.startedAt || new Date(),
        completedAt: data.completedAt,
      },
    });
  }

  private async initializeTestProgress(onboardingId: string, dteTypes: DteType[]) {
    const testsRequired: Record<string, number> = {};
    const testsCompleted: Record<string, number> = {};

    for (const dteType of dteTypes) {
      testsRequired[dteType] = TESTS_REQUIRED[dteType] || 1;
      testsCompleted[dteType] = 0;
    }

    // Upsert test progress
    await this.prisma.testProgress.upsert({
      where: { onboardingId },
      create: {
        onboardingId,
        testsRequired: JSON.stringify(testsRequired),
        testsCompleted: JSON.stringify(testsCompleted),
        eventsRequired: JSON.stringify(EVENTS_REQUIRED),
        eventsCompleted: JSON.stringify({ ANULACION: 0, CONTINGENCIA: 0, INVALIDACION: 0 }),
      },
      update: {
        testsRequired: JSON.stringify(testsRequired),
        testsCompleted: JSON.stringify(testsCompleted),
      },
    });
  }

  private getAvailableDteTypes() {
    return Object.entries(TESTS_REQUIRED).map(([dteType, testsRequired]) => ({
      dteType: dteType as DteType,
      name: this.getDteTypeName(dteType as DteType),
      testsRequired,
    }));
  }

  private getDteTypeName(dteType: DteType): string {
    const names: Record<DteType, string> = {
      FACTURA: 'Factura',
      CREDITO_FISCAL: 'Comprobante de Crédito Fiscal',
      NOTA_REMISION: 'Nota de Remisión',
      NOTA_CREDITO: 'Nota de Crédito',
      NOTA_DEBITO: 'Nota de Débito',
      COMPROBANTE_RETENCION: 'Comprobante de Retención',
      COMPROBANTE_LIQUIDACION: 'Comprobante de Liquidación',
      DOCUMENTO_CONTABLE_LIQUIDACION: 'Documento Contable de Liquidación',
      FACTURA_EXPORTACION: 'Factura de Exportación',
      FACTURA_SUJETO_EXCLUIDO: 'Factura de Sujeto Excluido',
      COMPROBANTE_DONACION: 'Comprobante de Donación',
    };
    return names[dteType] || dteType;
  }

  private formatOnboardingResponse(onboarding: any) {
    const { haciendaPassword, testCertPassword, prodCertPassword, testApiPassword, prodApiPassword, ...safe } = onboarding;

    return {
      ...safe,
      steps: this.buildStepsList(onboarding),
      hasHaciendaCredentials: !!haciendaPassword,
      hasTestCertificate: !!onboarding.testCertificate,
      hasTestApiCredentials: !!testApiPassword,
      hasProdCertificate: !!onboarding.prodCertificate,
      hasProdApiCredentials: !!prodApiPassword,
    };
  }

  private buildStepsList(onboarding: any) {
    const stepRecords = onboarding.steps || [];

    return STEP_ORDER.map((step, index) => {
      const record = stepRecords.find((r: any) => r.step === step);
      const currentIndex = STEP_ORDER.indexOf(onboarding.currentStep);

      return {
        step,
        ...STEP_METADATA[step],
        order: index + 1,
        status: record?.status || 'PENDING',
        isCurrentStep: step === onboarding.currentStep,
        canNavigateTo: index <= currentIndex,
        stepData: record?.stepData ? JSON.parse(record.stepData) : undefined,
        notes: record?.notes,
        blockerReason: record?.blockerReason,
        performedBy: record?.performedBy,
        startedAt: record?.startedAt,
        completedAt: record?.completedAt,
      };
    });
  }

  private getDefaultStepsList() {
    return STEP_ORDER.map((step, index) => ({
      step,
      ...STEP_METADATA[step],
      order: index + 1,
      status: 'PENDING',
      isCurrentStep: index === 0,
      canNavigateTo: index === 0,
    }));
  }

  private canProceedToNextStep(onboarding: any): boolean {
    const currentStep = onboarding.currentStep;
    const record = onboarding.steps?.find((s: any) => s.step === currentStep);

    // Can't proceed if current step is blocked or not completed
    if (record?.status === 'BLOCKED') return false;

    // Check step-specific requirements
    switch (currentStep) {
      case 'COMPANY_INFO':
        return !!(onboarding.nit && onboarding.razonSocial && onboarding.emailHacienda);
      case 'HACIENDA_CREDENTIALS':
        return !!(onboarding.haciendaUser && onboarding.haciendaPassword);
      case 'DTE_TYPE_SELECTION':
        return onboarding.dteTypes?.length > 0;
      case 'TEST_CERTIFICATE':
        return !!onboarding.testCertificate;
      case 'API_CREDENTIALS_TEST':
        return !!onboarding.testApiPassword;
      case 'EXECUTE_TESTS':
        return this.areAllTestsComplete(onboarding);
      case 'PROD_CERTIFICATE':
        return !!onboarding.prodCertificate;
      case 'API_CREDENTIALS_PROD':
        return !!onboarding.prodApiPassword;
      default:
        return true;
    }
  }

  private areAllTestsComplete(onboarding: any): boolean {
    if (!onboarding.testProgress) return false;

    const testsRequired = JSON.parse(onboarding.testProgress.testsRequired || '{}');
    const testsCompleted = JSON.parse(onboarding.testProgress.testsCompleted || '{}');
    const eventsRequired = JSON.parse(onboarding.testProgress.eventsRequired || '{}');
    const eventsCompleted = JSON.parse(onboarding.testProgress.eventsCompleted || '{}');

    for (const [key, required] of Object.entries(testsRequired)) {
      if ((testsCompleted[key] || 0) < (required as number)) return false;
    }

    for (const [key, required] of Object.entries(eventsRequired)) {
      if ((eventsCompleted[key] || 0) < (required as number)) return false;
    }

    return true;
  }

  private getNextAction(onboarding: { currentStep: string }): string | undefined {
    const step = onboarding.currentStep as OnboardingStep;

    const actions: Partial<Record<OnboardingStep, string>> = {
      WELCOME: 'Complete la introducción para continuar',
      COMPANY_INFO: 'Ingrese los datos de su empresa',
      HACIENDA_CREDENTIALS: 'Configure sus credenciales del MH',
      DTE_TYPE_SELECTION: 'Seleccione los tipos de DTE a emitir',
      TEST_ENVIRONMENT_REQUEST: 'Solicite acceso al ambiente de pruebas',
      TEST_CERTIFICATE: 'Suba su certificado de pruebas',
      API_CREDENTIALS_TEST: 'Configure las credenciales de API de pruebas',
      EXECUTE_TESTS: 'Ejecute las pruebas técnicas requeridas',
      REQUEST_AUTHORIZATION: 'Envíe su solicitud de autorización',
      PROD_CERTIFICATE: 'Suba su certificado de producción',
      API_CREDENTIALS_PROD: 'Configure las credenciales de API de producción',
      FINAL_VALIDATION: 'Complete la validación final',
    };

    return actions[step];
  }
}
