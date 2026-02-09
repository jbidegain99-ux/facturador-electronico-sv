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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const catalog_data_1 = require("./catalog.data");
let CatalogService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CatalogService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CatalogService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        getDepartamentos() {
            return catalog_data_1.DEPARTAMENTOS;
        }
        getDepartamento(codigo) {
            return catalog_data_1.DEPARTAMENTOS.find((d) => d.codigo === codigo);
        }
        getMunicipios(departamento) {
            if (departamento) {
                return catalog_data_1.MUNICIPIOS.filter((m) => m.departamento === departamento);
            }
            return catalog_data_1.MUNICIPIOS;
        }
        getMunicipio(codigo, departamento) {
            return catalog_data_1.MUNICIPIOS.find((m) => m.codigo === codigo && m.departamento === departamento);
        }
        getTiposDocumentoIdentificacion() {
            return catalog_data_1.TIPOS_DOCUMENTO_IDENTIFICACION;
        }
        getTipoDocumentoIdentificacion(codigo) {
            return catalog_data_1.TIPOS_DOCUMENTO_IDENTIFICACION.find((t) => t.codigo === codigo);
        }
        getUnidadesMedida() {
            return catalog_data_1.UNIDADES_MEDIDA;
        }
        getUnidadMedida(codigo) {
            return catalog_data_1.UNIDADES_MEDIDA.find((u) => u.codigo === codigo);
        }
        getTiposEstablecimiento() {
            return catalog_data_1.TIPOS_ESTABLECIMIENTO;
        }
        getTipoEstablecimiento(codigo) {
            return catalog_data_1.TIPOS_ESTABLECIMIENTO.find((t) => t.codigo === codigo);
        }
        getFormasPago() {
            return catalog_data_1.FORMAS_PAGO;
        }
        getFormaPago(codigo) {
            return catalog_data_1.FORMAS_PAGO.find((f) => f.codigo === codigo);
        }
        getCondicionesOperacion() {
            return catalog_data_1.CONDICIONES_OPERACION;
        }
        getCondicionOperacion(codigo) {
            return catalog_data_1.CONDICIONES_OPERACION.find((c) => c.codigo === codigo);
        }
        getTiposDte() {
            return catalog_data_1.TIPOS_DTE;
        }
        getTipoDte(codigo) {
            return catalog_data_1.TIPOS_DTE.find((t) => t.codigo === codigo);
        }
        getActividadesEconomicas() {
            return catalog_data_1.ACTIVIDADES_ECONOMICAS;
        }
        getActividadEconomica(codigo) {
            return catalog_data_1.ACTIVIDADES_ECONOMICAS.find((a) => a.codigo === codigo);
        }
        searchActividadesEconomicas(query) {
            const lowerQuery = query.toLowerCase();
            return catalog_data_1.ACTIVIDADES_ECONOMICAS.filter((a) => a.codigo.includes(query) ||
                a.descripcion.toLowerCase().includes(lowerQuery));
        }
    };
    return CatalogService = _classThis;
})();
exports.CatalogService = CatalogService;
