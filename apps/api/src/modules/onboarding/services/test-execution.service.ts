import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services';
import { DteTypeSelection } from '@prisma/client';
import { DteType, TestResult } from '../types/onboarding.types';
import { ExecuteTestDto, ExecuteEventTestDto } from '../dto';

// Test requirements per DTE type
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
export class TestExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // =========================================================================
  // GET TEST PROGRESS
  // =========================================================================

  async getTestProgress(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: {
        testProgress: true,
        dteTypes: true,
      },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    if (!onboarding.testProgress) {
      return {
        initialized: false,
        message: 'Seleccione los tipos de DTE primero para inicializar las pruebas',
      };
    }

    const testsRequired = JSON.parse(onboarding.testProgress.testsRequired);
    const testsCompleted = JSON.parse(onboarding.testProgress.testsCompleted);
    const eventsRequired = JSON.parse(onboarding.testProgress.eventsRequired);
    const eventsCompleted = JSON.parse(onboarding.testProgress.eventsCompleted);

    // Calculate totals
    const totalTestsRequired: number = Object.values(testsRequired as Record<string, number>).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalTestsCompleted: number = Object.values(testsCompleted as Record<string, number>).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalEventsRequired: number = Object.values(eventsRequired as Record<string, number>).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalEventsCompleted: number = Object.values(eventsCompleted as Record<string, number>).reduce(
      (sum, val) => sum + val,
      0,
    );

    // Build DTE progress
    const dteProgress = onboarding.dteTypes.map((dt) => ({
      dteType: dt.dteType,
      name: this.getDteTypeName(dt.dteType as DteType),
      required: testsRequired[dt.dteType] || 0,
      completed: testsCompleted[dt.dteType] || 0,
      isComplete:
        (testsCompleted[dt.dteType] || 0) >= (testsRequired[dt.dteType] || 0),
    }));

    // Build event progress
    const eventProgress = Object.entries(eventsRequired).map(([eventType, required]) => ({
      eventType,
      name: this.getEventTypeName(eventType),
      required: required as number,
      completed: eventsCompleted[eventType] || 0,
      isComplete: (eventsCompleted[eventType] || 0) >= (required as number),
    }));

    const totalRequired = totalTestsRequired + totalEventsRequired;
    const totalCompleted = totalTestsCompleted + totalEventsCompleted;

    return {
      initialized: true,
      totalTestsRequired: totalRequired,
      totalTestsCompleted: totalCompleted,
      percentComplete: totalRequired > 0
        ? Math.round((totalCompleted / totalRequired) * 100)
        : 0,
      dteProgress,
      eventProgress,
      canRequestAuthorization: totalCompleted >= totalRequired,
      lastTestAt: onboarding.testProgress.lastTestAt,
      lastTestResult: onboarding.testProgress.lastTestResult,
      lastTestError: onboarding.testProgress.lastTestError,
    };
  }

  // =========================================================================
  // EXECUTE DTE TEST
  // =========================================================================

  async executeDteTest(tenantId: string, dto: ExecuteTestDto) {
    const onboarding = await this.getOnboardingWithCredentials(tenantId);

    // Verify test environment is configured
    if (!onboarding.testCertificate || !onboarding.testApiPassword) {
      throw new BadRequestException(
        'Configure el certificado y credenciales de pruebas primero',
      );
    }

    // Check if this DTE type is selected
    const dteSelection = onboarding.dteTypes.find(
      (dt) => dt.dteType === dto.dteType,
    );
    if (!dteSelection) {
      throw new BadRequestException(
        `El tipo de DTE ${dto.dteType} no está seleccionado`,
      );
    }

    // Check if already completed all tests for this type
    const testsCompleted = JSON.parse(
      onboarding.testProgress?.testsCompleted || '{}',
    );
    const testsRequired = JSON.parse(
      onboarding.testProgress?.testsRequired || '{}',
    );

    if ((testsCompleted[dto.dteType] || 0) >= (testsRequired[dto.dteType] || 0)) {
      throw new BadRequestException(
        `Ya completó todas las pruebas requeridas para ${dto.dteType}`,
      );
    }

    // Execute the test against Hacienda's test API
    const result = await this.callHaciendaTestApi(onboarding, dto);

    // Update progress if successful
    if (result.success) {
      testsCompleted[dto.dteType] = (testsCompleted[dto.dteType] || 0) + 1;

      await this.prisma.testProgress.update({
        where: { onboardingId: onboarding.id },
        data: {
          testsCompleted: JSON.stringify(testsCompleted),
          lastTestAt: new Date(),
          lastTestResult: 'SUCCESS',
          lastTestError: null,
        },
      });

      // Mark DTE type as complete if all tests done
      if (testsCompleted[dto.dteType] >= testsRequired[dto.dteType]) {
        await this.prisma.dteTypeSelection.update({
          where: {
            onboardingId_dteType: {
              onboardingId: onboarding.id,
              dteType: dto.dteType,
            },
          },
          data: {
            testCompleted: true,
            testCompletedAt: new Date(),
          },
        });
      }
    } else {
      await this.prisma.testProgress.update({
        where: { onboardingId: onboarding.id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: 'FAILED',
          lastTestError: result.message,
        },
      });
    }

    return result;
  }

  // =========================================================================
  // EXECUTE EVENT TEST
  // =========================================================================

  async executeEventTest(tenantId: string, dto: ExecuteEventTestDto) {
    const onboarding = await this.getOnboardingWithCredentials(tenantId);

    if (!onboarding.testCertificate || !onboarding.testApiPassword) {
      throw new BadRequestException(
        'Configure el certificado y credenciales de pruebas primero',
      );
    }

    const eventsCompleted = JSON.parse(
      onboarding.testProgress?.eventsCompleted || '{}',
    );
    const eventsRequired = EVENTS_REQUIRED;

    if (
      (eventsCompleted[dto.eventType] || 0) >=
      (eventsRequired[dto.eventType as keyof typeof eventsRequired] || 0)
    ) {
      throw new BadRequestException(
        `Ya completó todas las pruebas requeridas para ${dto.eventType}`,
      );
    }

    // Execute event test
    const result = await this.callHaciendaEventApi(onboarding, dto);

    if (result.success) {
      eventsCompleted[dto.eventType] = (eventsCompleted[dto.eventType] || 0) + 1;

      await this.prisma.testProgress.update({
        where: { onboardingId: onboarding.id },
        data: {
          eventsCompleted: JSON.stringify(eventsCompleted),
          lastTestAt: new Date(),
          lastTestResult: 'SUCCESS',
          lastTestError: null,
        },
      });
    } else {
      await this.prisma.testProgress.update({
        where: { onboardingId: onboarding.id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: 'FAILED',
          lastTestError: result.message,
        },
      });
    }

    return result;
  }

  // =========================================================================
  // GET TEST HISTORY
  // =========================================================================

  async getTestHistory(tenantId: string, limit = 20) {
    // For now, return empty history - in production would query a test_logs table
    return {
      tests: [],
      total: 0,
      message: 'El historial de pruebas estará disponible próximamente',
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private async getOnboardingWithCredentials(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
      include: {
        testProgress: true,
        dteTypes: true,
      },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    return onboarding;
  }

  private async callHaciendaTestApi(
    onboarding: any,
    dto: ExecuteTestDto,
  ): Promise<{
    success: boolean;
    message: string;
    responseCode?: string;
    selloRecibido?: string;
    codigoGeneracion?: string;
    errors?: string[];
    timestamp: Date;
  }> {
    // Decrypt credentials
    const apiPassword = this.encryptionService.decrypt(onboarding.testApiPassword);
    const certPassword = this.encryptionService.decrypt(onboarding.testCertPassword);

    // TODO: Implement actual Hacienda API call
    // For now, simulate a successful test
    console.log(`[TEST] Executing DTE test for ${dto.dteType}`);
    console.log(`[TEST] API URL: ${onboarding.testEnvironmentUrl}`);
    console.log(`[TEST] NIT: ${onboarding.nit}`);

    // Simulate API response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        message: 'DTE procesado exitosamente en ambiente de pruebas',
        responseCode: 'OK',
        selloRecibido: `SELLO-TEST-${Date.now()}`,
        codigoGeneracion: `GEN-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date(),
      };
    } else {
      return {
        success: false,
        message: 'Error al procesar DTE en ambiente de pruebas',
        responseCode: 'ERROR',
        errors: ['Simulación de error para pruebas'],
        timestamp: new Date(),
      };
    }
  }

  private async callHaciendaEventApi(
    onboarding: any,
    dto: ExecuteEventTestDto,
  ): Promise<{
    success: boolean;
    message: string;
    responseCode?: string;
    errors?: string[];
    timestamp: Date;
  }> {
    const apiPassword = this.encryptionService.decrypt(onboarding.testApiPassword);

    console.log(`[TEST] Executing event test for ${dto.eventType}`);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const isSuccess = Math.random() > 0.15;

    if (isSuccess) {
      return {
        success: true,
        message: `Evento ${dto.eventType} procesado exitosamente`,
        responseCode: 'OK',
        timestamp: new Date(),
      };
    } else {
      return {
        success: false,
        message: `Error al procesar evento ${dto.eventType}`,
        responseCode: 'ERROR',
        errors: ['Simulación de error para pruebas'],
        timestamp: new Date(),
      };
    }
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

  private getEventTypeName(eventType: string): string {
    const names: Record<string, string> = {
      ANULACION: 'Anulación',
      CONTINGENCIA: 'Contingencia',
      INVALIDACION: 'Invalidación',
    };
    return names[eventType] || eventType;
  }
}
