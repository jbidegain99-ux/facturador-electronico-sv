"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingAdminController = exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
const onboarding_types_1 = require("./types/onboarding.types");
// =========================================================================
// TENANT CONTROLLER
// =========================================================================
let OnboardingController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('onboarding'), (0, common_1.Controller)('onboarding'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getOnboarding_decorators;
    let _getProgress_decorators;
    let _startOnboarding_decorators;
    let _updateCompanyInfo_decorators;
    let _setHaciendaCredentials_decorators;
    let _getDteTypes_decorators;
    let _setDteTypes_decorators;
    let _uploadTestCertificate_decorators;
    let _uploadProdCertificate_decorators;
    let _setTestApiCredentials_decorators;
    let _setProdApiCredentials_decorators;
    let _completeStep_decorators;
    let _goToStep_decorators;
    let _getTestProgress_decorators;
    let _executeTest_decorators;
    let _executeEventTest_decorators;
    let _getTestHistory_decorators;
    let _getCommunications_decorators;
    let _addCommunication_decorators;
    let _markAsRead_decorators;
    let _markAllAsRead_decorators;
    var OnboardingController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getOnboarding_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get current onboarding state' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Onboarding state retrieved' })];
            _getProgress_decorators = [(0, common_1.Get)('progress'), (0, swagger_1.ApiOperation)({ summary: 'Get onboarding progress summary' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress summary' })];
            _startOnboarding_decorators = [(0, common_1.Post)('start'), (0, swagger_1.ApiOperation)({ summary: 'Start the onboarding process' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Onboarding started' })];
            _updateCompanyInfo_decorators = [(0, common_1.Patch)('company-info'), (0, swagger_1.ApiOperation)({ summary: 'Update company information' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Company info updated' })];
            _setHaciendaCredentials_decorators = [(0, common_1.Post)('hacienda-credentials'), (0, swagger_1.ApiOperation)({ summary: 'Set Hacienda credentials' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Credentials saved' })];
            _getDteTypes_decorators = [(0, common_1.Get)('dte-types'), (0, swagger_1.ApiOperation)({ summary: 'Get selected and available DTE types' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'DTE types list' })];
            _setDteTypes_decorators = [(0, common_1.Post)('dte-types'), (0, swagger_1.ApiOperation)({ summary: 'Select DTE types to emit' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'DTE types saved' })];
            _uploadTestCertificate_decorators = [(0, common_1.Post)('test-certificate'), (0, swagger_1.ApiOperation)({ summary: 'Upload test environment certificate' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test certificate uploaded' })];
            _uploadProdCertificate_decorators = [(0, common_1.Post)('prod-certificate'), (0, swagger_1.ApiOperation)({ summary: 'Upload production certificate' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Production certificate uploaded' })];
            _setTestApiCredentials_decorators = [(0, common_1.Post)('test-api-credentials'), (0, swagger_1.ApiOperation)({ summary: 'Set test environment API credentials' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test API credentials saved' })];
            _setProdApiCredentials_decorators = [(0, common_1.Post)('prod-api-credentials'), (0, swagger_1.ApiOperation)({ summary: 'Set production API credentials' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Production API credentials saved' })];
            _completeStep_decorators = [(0, common_1.Post)('complete-step'), (0, swagger_1.ApiOperation)({ summary: 'Complete current step and advance' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Step completed' })];
            _goToStep_decorators = [(0, common_1.Post)('go-to-step'), (0, swagger_1.ApiOperation)({ summary: 'Navigate to a previous step' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Navigated to step' })];
            _getTestProgress_decorators = [(0, common_1.Get)('test-progress'), (0, swagger_1.ApiOperation)({ summary: 'Get test execution progress' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test progress summary' })];
            _executeTest_decorators = [(0, common_1.Post)('execute-test'), (0, swagger_1.ApiOperation)({ summary: 'Execute a DTE test' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test result' })];
            _executeEventTest_decorators = [(0, common_1.Post)('execute-event-test'), (0, swagger_1.ApiOperation)({ summary: 'Execute an event test (anulacion, contingencia, etc)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Event test result' })];
            _getTestHistory_decorators = [(0, common_1.Get)('test-history'), (0, swagger_1.ApiOperation)({ summary: 'Get test execution history' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test history' })];
            _getCommunications_decorators = [(0, common_1.Get)('communications'), (0, swagger_1.ApiOperation)({ summary: 'Get onboarding communications' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Communications list' })];
            _addCommunication_decorators = [(0, common_1.Post)('communications'), (0, swagger_1.ApiOperation)({ summary: 'Send a communication message' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent' })];
            _markAsRead_decorators = [(0, common_1.Post)('communications/:id/read'), (0, swagger_1.ApiOperation)({ summary: 'Mark a communication as read' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Marked as read' })];
            _markAllAsRead_decorators = [(0, common_1.Post)('communications/read-all'), (0, swagger_1.ApiOperation)({ summary: 'Mark all communications as read' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All marked as read' })];
            __esDecorate(this, null, _getOnboarding_decorators, { kind: "method", name: "getOnboarding", static: false, private: false, access: { has: obj => "getOnboarding" in obj, get: obj => obj.getOnboarding }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getProgress_decorators, { kind: "method", name: "getProgress", static: false, private: false, access: { has: obj => "getProgress" in obj, get: obj => obj.getProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startOnboarding_decorators, { kind: "method", name: "startOnboarding", static: false, private: false, access: { has: obj => "startOnboarding" in obj, get: obj => obj.startOnboarding }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateCompanyInfo_decorators, { kind: "method", name: "updateCompanyInfo", static: false, private: false, access: { has: obj => "updateCompanyInfo" in obj, get: obj => obj.updateCompanyInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setHaciendaCredentials_decorators, { kind: "method", name: "setHaciendaCredentials", static: false, private: false, access: { has: obj => "setHaciendaCredentials" in obj, get: obj => obj.setHaciendaCredentials }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDteTypes_decorators, { kind: "method", name: "getDteTypes", static: false, private: false, access: { has: obj => "getDteTypes" in obj, get: obj => obj.getDteTypes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setDteTypes_decorators, { kind: "method", name: "setDteTypes", static: false, private: false, access: { has: obj => "setDteTypes" in obj, get: obj => obj.setDteTypes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadTestCertificate_decorators, { kind: "method", name: "uploadTestCertificate", static: false, private: false, access: { has: obj => "uploadTestCertificate" in obj, get: obj => obj.uploadTestCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadProdCertificate_decorators, { kind: "method", name: "uploadProdCertificate", static: false, private: false, access: { has: obj => "uploadProdCertificate" in obj, get: obj => obj.uploadProdCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setTestApiCredentials_decorators, { kind: "method", name: "setTestApiCredentials", static: false, private: false, access: { has: obj => "setTestApiCredentials" in obj, get: obj => obj.setTestApiCredentials }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setProdApiCredentials_decorators, { kind: "method", name: "setProdApiCredentials", static: false, private: false, access: { has: obj => "setProdApiCredentials" in obj, get: obj => obj.setProdApiCredentials }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _completeStep_decorators, { kind: "method", name: "completeStep", static: false, private: false, access: { has: obj => "completeStep" in obj, get: obj => obj.completeStep }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _goToStep_decorators, { kind: "method", name: "goToStep", static: false, private: false, access: { has: obj => "goToStep" in obj, get: obj => obj.goToStep }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTestProgress_decorators, { kind: "method", name: "getTestProgress", static: false, private: false, access: { has: obj => "getTestProgress" in obj, get: obj => obj.getTestProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _executeTest_decorators, { kind: "method", name: "executeTest", static: false, private: false, access: { has: obj => "executeTest" in obj, get: obj => obj.executeTest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _executeEventTest_decorators, { kind: "method", name: "executeEventTest", static: false, private: false, access: { has: obj => "executeEventTest" in obj, get: obj => obj.executeEventTest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTestHistory_decorators, { kind: "method", name: "getTestHistory", static: false, private: false, access: { has: obj => "getTestHistory" in obj, get: obj => obj.getTestHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCommunications_decorators, { kind: "method", name: "getCommunications", static: false, private: false, access: { has: obj => "getCommunications" in obj, get: obj => obj.getCommunications }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addCommunication_decorators, { kind: "method", name: "addCommunication", static: false, private: false, access: { has: obj => "addCommunication" in obj, get: obj => obj.addCommunication }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markAsRead_decorators, { kind: "method", name: "markAsRead", static: false, private: false, access: { has: obj => "markAsRead" in obj, get: obj => obj.markAsRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markAllAsRead_decorators, { kind: "method", name: "markAllAsRead", static: false, private: false, access: { has: obj => "markAllAsRead" in obj, get: obj => obj.markAllAsRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OnboardingController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        onboardingService = __runInitializers(this, _instanceExtraInitializers);
        testExecutionService;
        communicationService;
        constructor(onboardingService, testExecutionService, communicationService) {
            this.onboardingService = onboardingService;
            this.testExecutionService = testExecutionService;
            this.communicationService = communicationService;
        }
        // -------------------------------------------------------------------------
        // ONBOARDING STATE
        // -------------------------------------------------------------------------
        async getOnboarding(user) {
            return this.onboardingService.getOnboarding(user.tenantId);
        }
        async getProgress(user) {
            return this.onboardingService.getProgress(user.tenantId);
        }
        async startOnboarding(user, dto) {
            return this.onboardingService.startOnboarding(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP: COMPANY INFO
        // -------------------------------------------------------------------------
        async updateCompanyInfo(user, dto) {
            return this.onboardingService.updateCompanyInfo(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP: HACIENDA CREDENTIALS
        // -------------------------------------------------------------------------
        async setHaciendaCredentials(user, dto) {
            return this.onboardingService.setHaciendaCredentials(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP: DTE TYPE SELECTION
        // -------------------------------------------------------------------------
        async getDteTypes(user) {
            return this.onboardingService.getDteTypes(user.tenantId);
        }
        async setDteTypes(user, dto) {
            return this.onboardingService.setDteTypes(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP: CERTIFICATES
        // -------------------------------------------------------------------------
        async uploadTestCertificate(user, dto) {
            return this.onboardingService.uploadTestCertificate(user.tenantId, dto, user.id);
        }
        async uploadProdCertificate(user, dto) {
            return this.onboardingService.uploadProdCertificate(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP: API CREDENTIALS
        // -------------------------------------------------------------------------
        async setTestApiCredentials(user, dto) {
            return this.onboardingService.setTestApiCredentials(user.tenantId, dto, user.id);
        }
        async setProdApiCredentials(user, dto) {
            return this.onboardingService.setProdApiCredentials(user.tenantId, dto, user.id);
        }
        // -------------------------------------------------------------------------
        // STEP NAVIGATION
        // -------------------------------------------------------------------------
        async completeStep(user, dto) {
            return this.onboardingService.completeStep(user.tenantId, dto, user.id);
        }
        async goToStep(user, dto) {
            return this.onboardingService.goToStep(user.tenantId, dto);
        }
        // -------------------------------------------------------------------------
        // TEST EXECUTION
        // -------------------------------------------------------------------------
        async getTestProgress(user) {
            return this.testExecutionService.getTestProgress(user.tenantId);
        }
        async executeTest(user, dto) {
            return this.testExecutionService.executeDteTest(user.tenantId, dto);
        }
        async executeEventTest(user, dto) {
            return this.testExecutionService.executeEventTest(user.tenantId, dto);
        }
        async getTestHistory(user, limit) {
            return this.testExecutionService.getTestHistory(user.tenantId, limit ? parseInt(limit, 10) : 20);
        }
        // -------------------------------------------------------------------------
        // COMMUNICATIONS
        // -------------------------------------------------------------------------
        async getCommunications(user, page, limit) {
            return this.communicationService.getCommunications(user.tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        }
        async addCommunication(user, dto) {
            return this.communicationService.addClientCommunication(user.tenantId, dto, user.id);
        }
        async markAsRead(user, id) {
            return this.communicationService.markAsRead(user.tenantId, id);
        }
        async markAllAsRead(user) {
            return this.communicationService.markAllAsRead(user.tenantId);
        }
    };
    return OnboardingController = _classThis;
})();
exports.OnboardingController = OnboardingController;
// =========================================================================
// ADMIN CONTROLLER
// =========================================================================
let OnboardingAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('admin-onboarding'), (0, common_1.Controller)('admin/onboarding'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), super_admin_guard_1.SuperAdminGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAll_decorators;
    let _getTenantOnboarding_decorators;
    let _getTenantProgress_decorators;
    let _updateStep_decorators;
    let _getTenantTestProgress_decorators;
    let _getAllCommunications_decorators;
    let _getTenantCommunications_decorators;
    let _sendCommunication_decorators;
    var OnboardingAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all onboarding processes (admin)' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: onboarding_types_1.OnboardingStatus }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All onboarding processes' })];
            _getTenantOnboarding_decorators = [(0, common_1.Get)(':tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Get specific tenant onboarding (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Onboarding details' })];
            _getTenantProgress_decorators = [(0, common_1.Get)(':tenantId/progress'), (0, swagger_1.ApiOperation)({ summary: 'Get tenant onboarding progress (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress summary' })];
            _updateStep_decorators = [(0, common_1.Patch)(':tenantId/step'), (0, swagger_1.ApiOperation)({ summary: 'Update a step status (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Step updated' })];
            _getTenantTestProgress_decorators = [(0, common_1.Get)(':tenantId/test-progress'), (0, swagger_1.ApiOperation)({ summary: 'Get tenant test progress (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test progress' })];
            _getAllCommunications_decorators = [(0, common_1.Get)('communications/all'), (0, swagger_1.ApiOperation)({ summary: 'Get all communications (admin)' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All communications' })];
            _getTenantCommunications_decorators = [(0, common_1.Get)(':tenantId/communications'), (0, swagger_1.ApiOperation)({ summary: 'Get tenant communications (admin)' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant communications' })];
            _sendCommunication_decorators = [(0, common_1.Post)(':onboardingId/communications'), (0, swagger_1.ApiOperation)({ summary: 'Send communication to tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent' })];
            __esDecorate(this, null, _getAll_decorators, { kind: "method", name: "getAll", static: false, private: false, access: { has: obj => "getAll" in obj, get: obj => obj.getAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantOnboarding_decorators, { kind: "method", name: "getTenantOnboarding", static: false, private: false, access: { has: obj => "getTenantOnboarding" in obj, get: obj => obj.getTenantOnboarding }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantProgress_decorators, { kind: "method", name: "getTenantProgress", static: false, private: false, access: { has: obj => "getTenantProgress" in obj, get: obj => obj.getTenantProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateStep_decorators, { kind: "method", name: "updateStep", static: false, private: false, access: { has: obj => "updateStep" in obj, get: obj => obj.updateStep }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantTestProgress_decorators, { kind: "method", name: "getTenantTestProgress", static: false, private: false, access: { has: obj => "getTenantTestProgress" in obj, get: obj => obj.getTenantTestProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAllCommunications_decorators, { kind: "method", name: "getAllCommunications", static: false, private: false, access: { has: obj => "getAllCommunications" in obj, get: obj => obj.getAllCommunications }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantCommunications_decorators, { kind: "method", name: "getTenantCommunications", static: false, private: false, access: { has: obj => "getTenantCommunications" in obj, get: obj => obj.getTenantCommunications }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendCommunication_decorators, { kind: "method", name: "sendCommunication", static: false, private: false, access: { has: obj => "sendCommunication" in obj, get: obj => obj.sendCommunication }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OnboardingAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        onboardingService = __runInitializers(this, _instanceExtraInitializers);
        testExecutionService;
        communicationService;
        constructor(onboardingService, testExecutionService, communicationService) {
            this.onboardingService = onboardingService;
            this.testExecutionService = testExecutionService;
            this.communicationService = communicationService;
        }
        // -------------------------------------------------------------------------
        // LIST AND STATS
        // -------------------------------------------------------------------------
        async getAll(status) {
            return this.onboardingService.getAll(status);
        }
        async getTenantOnboarding(tenantId) {
            return this.onboardingService.getOnboarding(tenantId);
        }
        async getTenantProgress(tenantId) {
            return this.onboardingService.getProgress(tenantId);
        }
        // -------------------------------------------------------------------------
        // ADMIN STEP MANAGEMENT
        // -------------------------------------------------------------------------
        async updateStep(user, tenantId, body) {
            return this.onboardingService.adminUpdateStep(tenantId, body.step, body.status, user.id, body.notes, body.blockerReason);
        }
        // -------------------------------------------------------------------------
        // TEST PROGRESS (ADMIN)
        // -------------------------------------------------------------------------
        async getTenantTestProgress(tenantId) {
            return this.testExecutionService.getTestProgress(tenantId);
        }
        // -------------------------------------------------------------------------
        // COMMUNICATIONS (ADMIN)
        // -------------------------------------------------------------------------
        async getAllCommunications(page, limit) {
            return this.communicationService.getAllCommunications(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
        }
        async getTenantCommunications(tenantId, page, limit) {
            return this.communicationService.getCommunications(tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        }
        async sendCommunication(user, onboardingId, dto) {
            return this.communicationService.addAdminCommunication(onboardingId, dto, user.id);
        }
    };
    return OnboardingAdminController = _classThis;
})();
exports.OnboardingAdminController = OnboardingAdminController;
