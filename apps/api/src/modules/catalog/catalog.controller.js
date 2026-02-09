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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
let CatalogController = (() => {
    let _classDecorators = [(0, common_1.Controller)('catalogs')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getDepartamentos_decorators;
    let _getDepartamento_decorators;
    let _getMunicipios_decorators;
    let _getTiposDocumento_decorators;
    let _getUnidadesMedida_decorators;
    let _getTiposEstablecimiento_decorators;
    let _getFormasPago_decorators;
    let _getCondicionesOperacion_decorators;
    let _getTiposDte_decorators;
    let _getActividadesEconomicas_decorators;
    let _getActividadEconomica_decorators;
    var CatalogController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getDepartamentos_decorators = [(0, common_1.Get)('departamentos')];
            _getDepartamento_decorators = [(0, common_1.Get)('departamentos/:codigo')];
            _getMunicipios_decorators = [(0, common_1.Get)('municipios')];
            _getTiposDocumento_decorators = [(0, common_1.Get)('tipos-documento')];
            _getUnidadesMedida_decorators = [(0, common_1.Get)('unidades-medida')];
            _getTiposEstablecimiento_decorators = [(0, common_1.Get)('tipos-establecimiento')];
            _getFormasPago_decorators = [(0, common_1.Get)('formas-pago')];
            _getCondicionesOperacion_decorators = [(0, common_1.Get)('condiciones-operacion')];
            _getTiposDte_decorators = [(0, common_1.Get)('tipos-dte')];
            _getActividadesEconomicas_decorators = [(0, common_1.Get)('actividades-economicas')];
            _getActividadEconomica_decorators = [(0, common_1.Get)('actividades-economicas/:codigo')];
            __esDecorate(this, null, _getDepartamentos_decorators, { kind: "method", name: "getDepartamentos", static: false, private: false, access: { has: obj => "getDepartamentos" in obj, get: obj => obj.getDepartamentos }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDepartamento_decorators, { kind: "method", name: "getDepartamento", static: false, private: false, access: { has: obj => "getDepartamento" in obj, get: obj => obj.getDepartamento }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMunicipios_decorators, { kind: "method", name: "getMunicipios", static: false, private: false, access: { has: obj => "getMunicipios" in obj, get: obj => obj.getMunicipios }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTiposDocumento_decorators, { kind: "method", name: "getTiposDocumento", static: false, private: false, access: { has: obj => "getTiposDocumento" in obj, get: obj => obj.getTiposDocumento }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUnidadesMedida_decorators, { kind: "method", name: "getUnidadesMedida", static: false, private: false, access: { has: obj => "getUnidadesMedida" in obj, get: obj => obj.getUnidadesMedida }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTiposEstablecimiento_decorators, { kind: "method", name: "getTiposEstablecimiento", static: false, private: false, access: { has: obj => "getTiposEstablecimiento" in obj, get: obj => obj.getTiposEstablecimiento }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getFormasPago_decorators, { kind: "method", name: "getFormasPago", static: false, private: false, access: { has: obj => "getFormasPago" in obj, get: obj => obj.getFormasPago }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCondicionesOperacion_decorators, { kind: "method", name: "getCondicionesOperacion", static: false, private: false, access: { has: obj => "getCondicionesOperacion" in obj, get: obj => obj.getCondicionesOperacion }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTiposDte_decorators, { kind: "method", name: "getTiposDte", static: false, private: false, access: { has: obj => "getTiposDte" in obj, get: obj => obj.getTiposDte }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getActividadesEconomicas_decorators, { kind: "method", name: "getActividadesEconomicas", static: false, private: false, access: { has: obj => "getActividadesEconomicas" in obj, get: obj => obj.getActividadesEconomicas }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getActividadEconomica_decorators, { kind: "method", name: "getActividadEconomica", static: false, private: false, access: { has: obj => "getActividadEconomica" in obj, get: obj => obj.getActividadEconomica }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CatalogController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        catalogService = __runInitializers(this, _instanceExtraInitializers);
        constructor(catalogService) {
            this.catalogService = catalogService;
        }
        getDepartamentos() {
            return this.catalogService.getDepartamentos();
        }
        getDepartamento(codigo) {
            return this.catalogService.getDepartamento(codigo);
        }
        getMunicipios(departamento) {
            return this.catalogService.getMunicipios(departamento);
        }
        getTiposDocumento() {
            return this.catalogService.getTiposDocumentoIdentificacion();
        }
        getUnidadesMedida() {
            return this.catalogService.getUnidadesMedida();
        }
        getTiposEstablecimiento() {
            return this.catalogService.getTiposEstablecimiento();
        }
        getFormasPago() {
            return this.catalogService.getFormasPago();
        }
        getCondicionesOperacion() {
            return this.catalogService.getCondicionesOperacion();
        }
        getTiposDte() {
            return this.catalogService.getTiposDte();
        }
        getActividadesEconomicas(query) {
            if (query) {
                return this.catalogService.searchActividadesEconomicas(query);
            }
            return this.catalogService.getActividadesEconomicas();
        }
        getActividadEconomica(codigo) {
            return this.catalogService.getActividadEconomica(codigo);
        }
    };
    return CatalogController = _classThis;
})();
exports.CatalogController = CatalogController;
