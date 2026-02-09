"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestExecutionService = void 0;
const common_1 = require("@nestjs/common");
// Test requirements per DTE type
const TESTS_REQUIRED = {
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
let TestExecutionService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TestExecutionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TestExecutionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        encryptionService;
        constructor(prisma, encryptionService) {
            this.prisma = prisma;
            this.encryptionService = encryptionService;
        }
        // =========================================================================
        // GET TEST PROGRESS
        // =========================================================================
        async getTestProgress(tenantId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
                include: {
                    testProgress: true,
                    dteTypes: true,
                },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
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
            const totalTestsRequired = Object.values(testsRequired).reduce((sum, val) => sum + val, 0);
            const totalTestsCompleted = Object.values(testsCompleted).reduce((sum, val) => sum + val, 0);
            const totalEventsRequired = Object.values(eventsRequired).reduce((sum, val) => sum + val, 0);
            const totalEventsCompleted = Object.values(eventsCompleted).reduce((sum, val) => sum + val, 0);
            // Build DTE progress
            const dteProgress = onboarding.dteTypes.map((dt) => ({
                dteType: dt.dteType,
                name: this.getDteTypeName(dt.dteType),
                required: testsRequired[dt.dteType] || 0,
                completed: testsCompleted[dt.dteType] || 0,
                isComplete: (testsCompleted[dt.dteType] || 0) >= (testsRequired[dt.dteType] || 0),
            }));
            // Build event progress
            const eventProgress = Object.entries(eventsRequired).map(([eventType, required]) => ({
                eventType,
                name: this.getEventTypeName(eventType),
                required: required,
                completed: eventsCompleted[eventType] || 0,
                isComplete: (eventsCompleted[eventType] || 0) >= required,
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
        async executeDteTest(tenantId, dto) {
            const onboarding = await this.getOnboardingWithCredentials(tenantId);
            // Verify test environment is configured
            if (!onboarding.testCertificate || !onboarding.testApiPassword) {
                throw new common_1.BadRequestException('Configure el certificado y credenciales de pruebas primero');
            }
            // Check if this DTE type is selected
            const dteSelection = onboarding.dteTypes.find((dt) => dt.dteType === dto.dteType);
            if (!dteSelection) {
                throw new common_1.BadRequestException(`El tipo de DTE ${dto.dteType} no está seleccionado`);
            }
            // Check if already completed all tests for this type
            const testsCompleted = JSON.parse(onboarding.testProgress?.testsCompleted || '{}');
            const testsRequired = JSON.parse(onboarding.testProgress?.testsRequired || '{}');
            if ((testsCompleted[dto.dteType] || 0) >= (testsRequired[dto.dteType] || 0)) {
                throw new common_1.BadRequestException(`Ya completó todas las pruebas requeridas para ${dto.dteType}`);
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
            }
            else {
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
        async executeEventTest(tenantId, dto) {
            const onboarding = await this.getOnboardingWithCredentials(tenantId);
            if (!onboarding.testCertificate || !onboarding.testApiPassword) {
                throw new common_1.BadRequestException('Configure el certificado y credenciales de pruebas primero');
            }
            const eventsCompleted = JSON.parse(onboarding.testProgress?.eventsCompleted || '{}');
            const eventsRequired = EVENTS_REQUIRED;
            if ((eventsCompleted[dto.eventType] || 0) >=
                (eventsRequired[dto.eventType] || 0)) {
                throw new common_1.BadRequestException(`Ya completó todas las pruebas requeridas para ${dto.eventType}`);
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
            }
            else {
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
        async getTestHistory(tenantId, limit = 20) {
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
        async getOnboardingWithCredentials(tenantId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
                include: {
                    testProgress: true,
                    dteTypes: true,
                },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            return onboarding;
        }
        async callHaciendaTestApi(onboarding, dto) {
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
            }
            else {
                return {
                    success: false,
                    message: 'Error al procesar DTE en ambiente de pruebas',
                    responseCode: 'ERROR',
                    errors: ['Simulación de error para pruebas'],
                    timestamp: new Date(),
                };
            }
        }
        async callHaciendaEventApi(onboarding, dto) {
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
            }
            else {
                return {
                    success: false,
                    message: `Error al procesar evento ${dto.eventType}`,
                    responseCode: 'ERROR',
                    errors: ['Simulación de error para pruebas'],
                    timestamp: new Date(),
                };
            }
        }
        getDteTypeName(dteType) {
            const names = {
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
        getEventTypeName(eventType) {
            const names = {
                ANULACION: 'Anulación',
                CONTINGENCIA: 'Contingencia',
                INVALIDACION: 'Invalidación',
            };
            return names[eventType] || eventType;
        }
    };
    return TestExecutionService = _classThis;
})();
exports.TestExecutionService = TestExecutionService;
