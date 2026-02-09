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
exports.DteBuilderService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const shared_1 = require("@facturador/shared");
let DteBuilderService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DteBuilderService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DteBuilderService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        IVA_RATE = 0.13;
        generateCodigoGeneracion() {
            return (0, crypto_1.randomUUID)().toUpperCase();
        }
        generateNumeroControl(tipoDte, codEstablecimiento, correlativo) {
            const codEstab = codEstablecimiento.padStart(8, '0').slice(0, 8);
            const corr = correlativo.toString().padStart(15, '0').slice(0, 15);
            return `DTE-${tipoDte}-${codEstab}-${corr}`;
        }
        getCurrentDate() {
            return new Date().toISOString().split('T')[0];
        }
        getCurrentTime() {
            return new Date().toTimeString().split(' ')[0];
        }
        roundTo2Decimals(num) {
            return Math.round(num * 100) / 100;
        }
        numberToWords(num) {
            const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
            const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
            const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
            const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
            const intPart = Math.floor(num);
            const decPart = Math.round((num - intPart) * 100);
            const convertGroup = (n) => {
                if (n === 0)
                    return '';
                if (n < 10)
                    return units[n];
                if (n < 20)
                    return teens[n - 10];
                if (n < 100) {
                    const ten = Math.floor(n / 10);
                    const unit = n % 10;
                    if (n === 20)
                        return 'VEINTE';
                    if (n < 30)
                        return 'VEINTI' + units[unit];
                    return tens[ten] + (unit ? ' Y ' + units[unit] : '');
                }
                if (n === 100)
                    return 'CIEN';
                const hundred = Math.floor(n / 100);
                const rest = n % 100;
                return hundreds[hundred] + (rest ? ' ' + convertGroup(rest) : '');
            };
            let result = '';
            if (intPart === 0) {
                result = 'CERO';
            }
            else if (intPart >= 1000000) {
                const millions = Math.floor(intPart / 1000000);
                const rest = intPart % 1000000;
                result = (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') +
                    (rest ? ' ' + this.convertThousands(rest, convertGroup) : '');
            }
            else {
                result = this.convertThousands(intPart, convertGroup);
            }
            return `${result} ${decPart.toString().padStart(2, '0')}/100 USD`;
        }
        convertThousands(n, convertGroup) {
            if (n >= 1000) {
                const thousands = Math.floor(n / 1000);
                const rest = n % 1000;
                return (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') +
                    (rest ? ' ' + convertGroup(rest) : '');
            }
            return convertGroup(n);
        }
        buildFactura(input) {
            const tipoDte = '01';
            const ambiente = input.ambiente || '00';
            const codigoGeneracion = this.generateCodigoGeneracion();
            const numeroControl = this.generateNumeroControl(tipoDte, input.codEstablecimiento, input.correlativo);
            const identificacion = {
                version: shared_1.DTE_VERSIONS[tipoDte],
                ambiente,
                tipoDte,
                numeroControl,
                codigoGeneracion,
                tipoModelo: 1,
                tipoOperacion: 1,
                tipoContingencia: null,
                motivoContin: null,
                fecEmi: this.getCurrentDate(),
                horEmi: this.getCurrentTime(),
                tipoMoneda: 'USD',
            };
            const cuerpoDocumento = input.items.map((item, index) => {
                const subtotal = item.cantidad * item.precioUnitario;
                const esGravado = item.esGravado !== false && !item.esExento;
                const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
                const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;
                const ivaItem = esGravado ? this.roundTo2Decimals(ventaGravada * this.IVA_RATE) : 0;
                return {
                    numItem: index + 1,
                    tipoItem: 1,
                    numeroDocumento: null,
                    cantidad: item.cantidad,
                    codigo: item.codigo || null,
                    codTributo: null,
                    uniMedida: 59, // Unidad
                    descripcion: item.descripcion,
                    precioUni: item.precioUnitario,
                    montoDescu: 0,
                    ventaNoSuj: 0,
                    ventaExenta,
                    ventaGravada,
                    tributos: esGravado ? ['20'] : null,
                    psv: 0,
                    noGravado: 0,
                    ivaItem,
                };
            });
            const totalGravada = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaGravada, 0));
            const totalExenta = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaExenta, 0));
            const totalNoSuj = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaNoSuj, 0));
            const totalIva = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ivaItem, 0));
            const subTotalVentas = this.roundTo2Decimals(totalGravada + totalExenta + totalNoSuj);
            const montoTotalOperacion = this.roundTo2Decimals(subTotalVentas + totalIva);
            const tributos = totalGravada > 0 ? [{
                    codigo: '20',
                    descripcion: 'Impuesto al Valor Agregado 13%',
                    valor: totalIva,
                }] : null;
            const pagos = input.condicionOperacion !== 2 ? [{
                    codigo: '01',
                    montoPago: montoTotalOperacion,
                    referencia: null,
                    plazo: null,
                    periodo: null,
                }] : null;
            const resumen = {
                totalNoSuj,
                totalExenta,
                totalGravada,
                subTotalVentas,
                descuNoSuj: 0,
                descuExenta: 0,
                descuGravada: 0,
                porcentajeDescuento: 0,
                totalDescu: 0,
                tributos,
                subTotal: subTotalVentas,
                ivaRete1: 0,
                reteRenta: 0,
                montoTotalOperacion,
                totalNoGravado: 0,
                totalPagar: montoTotalOperacion,
                totalLetras: this.numberToWords(montoTotalOperacion),
                totalIva,
                saldoFavor: 0,
                condicionOperacion: input.condicionOperacion || 1,
                pagos,
                numPagoElectronico: null,
            };
            return {
                identificacion,
                documentoRelacionado: null,
                emisor: input.emisor,
                receptor: input.receptor || null,
                otrosDocumentos: null,
                ventaTercero: null,
                cuerpoDocumento,
                resumen,
                extension: null,
                apendice: null,
            };
        }
        buildCCF(input) {
            const tipoDte = '03';
            const ambiente = input.ambiente || '00';
            const codigoGeneracion = this.generateCodigoGeneracion();
            const numeroControl = this.generateNumeroControl(tipoDte, input.codEstablecimiento, input.correlativo);
            const identificacion = {
                version: shared_1.DTE_VERSIONS[tipoDte],
                ambiente,
                tipoDte,
                numeroControl,
                codigoGeneracion,
                tipoModelo: 1,
                tipoOperacion: 1,
                tipoContingencia: null,
                motivoContin: null,
                fecEmi: this.getCurrentDate(),
                horEmi: this.getCurrentTime(),
                tipoMoneda: 'USD',
            };
            const cuerpoDocumento = input.items.map((item, index) => {
                const subtotal = item.cantidad * item.precioUnitario;
                const esGravado = item.esGravado !== false && !item.esExento;
                const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
                const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;
                return {
                    numItem: index + 1,
                    tipoItem: 1,
                    numeroDocumento: null,
                    cantidad: item.cantidad,
                    codigo: item.codigo || null,
                    codTributo: null,
                    uniMedida: 59,
                    descripcion: item.descripcion,
                    precioUni: item.precioUnitario,
                    montoDescu: 0,
                    ventaNoSuj: 0,
                    ventaExenta,
                    ventaGravada,
                    tributos: esGravado ? ['20'] : null,
                    psv: 0,
                    noGravado: 0,
                };
            });
            const totalGravada = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaGravada, 0));
            const totalExenta = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaExenta, 0));
            const totalNoSuj = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaNoSuj, 0));
            const subTotalVentas = this.roundTo2Decimals(totalGravada + totalExenta + totalNoSuj);
            const tributos = totalGravada > 0 ? [{
                    codigo: '20',
                    descripcion: 'Impuesto al Valor Agregado 13%',
                    valor: this.roundTo2Decimals(totalGravada * this.IVA_RATE),
                }] : null;
            const ivaTotal = tributos ? tributos[0].valor : 0;
            const montoTotalOperacion = this.roundTo2Decimals(subTotalVentas + ivaTotal);
            const pagos = input.condicionOperacion !== 2 ? [{
                    codigo: '01',
                    montoPago: montoTotalOperacion,
                    referencia: null,
                    plazo: null,
                    periodo: null,
                }] : null;
            const resumen = {
                totalNoSuj,
                totalExenta,
                totalGravada,
                subTotalVentas,
                descuNoSuj: 0,
                descuExenta: 0,
                descuGravada: 0,
                porcentajeDescuento: 0,
                totalDescu: 0,
                tributos,
                subTotal: subTotalVentas,
                ivaPerci1: 0,
                ivaRete1: 0,
                reteRenta: 0,
                montoTotalOperacion,
                totalNoGravado: 0,
                totalPagar: montoTotalOperacion,
                totalLetras: this.numberToWords(montoTotalOperacion),
                saldoFavor: 0,
                condicionOperacion: input.condicionOperacion || 1,
                pagos,
                numPagoElectronico: null,
            };
            return {
                identificacion,
                documentoRelacionado: null,
                emisor: input.emisor,
                receptor: input.receptor,
                otrosDocumentos: null,
                ventaTercero: null,
                cuerpoDocumento,
                resumen,
                extension: null,
                apendice: null,
            };
        }
    };
    return DteBuilderService = _classThis;
})();
exports.DteBuilderService = DteBuilderService;
