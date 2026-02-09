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
exports.DteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
let DteController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('dte'), (0, common_1.Controller)('dte'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _sign_decorators;
    let _transmit_decorators;
    let _findAll_decorators;
    let _getSummaryStats_decorators;
    let _getStatsByDate_decorators;
    let _getStatsByType_decorators;
    let _getStatsByStatus_decorators;
    let _getTopClients_decorators;
    let _getRecentDTEs_decorators;
    let _findOne_decorators;
    let _downloadPdf_decorators;
    let _anular_decorators;
    var DteController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo DTE' })];
            _sign_decorators = [(0, common_1.Post)(':id/sign'), (0, swagger_1.ApiOperation)({ summary: 'Firmar DTE' })];
            _transmit_decorators = [(0, common_1.Post)(':id/transmit'), (0, swagger_1.ApiOperation)({ summary: 'Transmitir DTE al MH' })];
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar DTEs del tenant con paginacion' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Numero de pagina (default: 1)' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Registros por pagina (default: 20, max: 100)' }), (0, swagger_1.ApiQuery)({ name: 'tipoDte', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'estado', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, description: 'Campo para ordenar (createdAt, totalPagar, numeroControl)' }), (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, description: 'Orden: asc o desc (default: desc)' })];
            _getSummaryStats_decorators = [(0, common_1.Get)('stats/summary'), (0, swagger_1.ApiOperation)({ summary: 'Obtener resumen de estadisticas del tenant' })];
            _getStatsByDate_decorators = [(0, common_1.Get)('stats/by-date'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadisticas por rango de fechas' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })];
            _getStatsByType_decorators = [(0, common_1.Get)('stats/by-type'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadisticas por tipo de DTE' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String })];
            _getStatsByStatus_decorators = [(0, common_1.Get)('stats/by-status'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadisticas por estado' })];
            _getTopClients_decorators = [(0, common_1.Get)('stats/top-clients'), (0, swagger_1.ApiOperation)({ summary: 'Obtener top clientes por facturacion' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String })];
            _getRecentDTEs_decorators = [(0, common_1.Get)('recent'), (0, swagger_1.ApiOperation)({ summary: 'Obtener los DTEs mas recientes' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener DTE por ID' })];
            _downloadPdf_decorators = [(0, common_1.Get)(':id/pdf'), (0, swagger_1.ApiOperation)({ summary: 'Descargar DTE como PDF' }), (0, swagger_1.ApiProduces)('application/pdf')];
            _anular_decorators = [(0, common_1.Post)(':id/anular'), (0, swagger_1.ApiOperation)({ summary: 'Anular DTE' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sign_decorators, { kind: "method", name: "sign", static: false, private: false, access: { has: obj => "sign" in obj, get: obj => obj.sign }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _transmit_decorators, { kind: "method", name: "transmit", static: false, private: false, access: { has: obj => "transmit" in obj, get: obj => obj.transmit }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSummaryStats_decorators, { kind: "method", name: "getSummaryStats", static: false, private: false, access: { has: obj => "getSummaryStats" in obj, get: obj => obj.getSummaryStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStatsByDate_decorators, { kind: "method", name: "getStatsByDate", static: false, private: false, access: { has: obj => "getStatsByDate" in obj, get: obj => obj.getStatsByDate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStatsByType_decorators, { kind: "method", name: "getStatsByType", static: false, private: false, access: { has: obj => "getStatsByType" in obj, get: obj => obj.getStatsByType }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStatsByStatus_decorators, { kind: "method", name: "getStatsByStatus", static: false, private: false, access: { has: obj => "getStatsByStatus" in obj, get: obj => obj.getStatsByStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTopClients_decorators, { kind: "method", name: "getTopClients", static: false, private: false, access: { has: obj => "getTopClients" in obj, get: obj => obj.getTopClients }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getRecentDTEs_decorators, { kind: "method", name: "getRecentDTEs", static: false, private: false, access: { has: obj => "getRecentDTEs" in obj, get: obj => obj.getRecentDTEs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _downloadPdf_decorators, { kind: "method", name: "downloadPdf", static: false, private: false, access: { has: obj => "downloadPdf" in obj, get: obj => obj.downloadPdf }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _anular_decorators, { kind: "method", name: "anular", static: false, private: false, access: { has: obj => "anular" in obj, get: obj => obj.anular }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DteController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        dteService = __runInitializers(this, _instanceExtraInitializers);
        pdfService;
        constructor(dteService, pdfService) {
            this.dteService = dteService;
            this.pdfService = pdfService;
        }
        create(req, createDteDto) {
            return this.dteService.createDte(req.user.tenantId, createDteDto.tipoDte, createDteDto.data);
        }
        sign(id) {
            return this.dteService.signDte(id);
        }
        transmit(id, credentials) {
            return this.dteService.transmitDte(id, credentials.nit, credentials.password);
        }
        findAll(req, page, limit, tipoDte, estado, search, sortBy, sortOrder) {
            const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100) : 20;
            return this.dteService.findByTenant(req.user.tenantId, page ? parseInt(page, 10) : 1, parsedLimit, { tipoDte, estado, search }, sortBy, sortOrder);
        }
        getSummaryStats(req) {
            return this.dteService.getSummaryStats(req.user.tenantId);
        }
        getStatsByDate(req, startDate, endDate, groupBy) {
            return this.dteService.getStatsByDate(req.user.tenantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, groupBy || 'day');
        }
        getStatsByType(req, startDate, endDate) {
            return this.dteService.getStatsByType(req.user.tenantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        }
        getStatsByStatus(req) {
            return this.dteService.getStatsByStatus(req.user.tenantId);
        }
        getTopClients(req, limit, startDate, endDate) {
            return this.dteService.getTopClients(req.user.tenantId, limit ? parseInt(limit, 10) : 10, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        }
        getRecentDTEs(req, limit) {
            return this.dteService.getRecentDTEs(req.user.tenantId, limit ? parseInt(limit, 10) : 5);
        }
        findOne(id) {
            return this.dteService.findOne(id);
        }
        async downloadPdf(id, res) {
            const dte = await this.dteService.findOneWithTenant(id);
            if (!dte) {
                throw new common_1.NotFoundException('DTE no encontrado');
            }
            const pdfBuffer = await this.pdfService.generateInvoicePdf({
                ...dte,
                data: dte.jsonOriginal ? JSON.parse(dte.jsonOriginal) : {},
            });
            const filename = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        }
        anular(id, body) {
            return this.dteService.anularDte(id, body.motivo);
        }
    };
    return DteController = _classThis;
})();
exports.DteController = DteController;
