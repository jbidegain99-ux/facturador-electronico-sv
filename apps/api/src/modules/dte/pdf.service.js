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
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
let PdfService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PdfService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PdfService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(PdfService.name);
        getTipoDteLabel(tipoDte) {
            const tipos = {
                '01': 'Factura',
                '03': 'Comprobante de Credito Fiscal',
                '05': 'Nota de Credito',
                '06': 'Nota de Debito',
                '07': 'Comprobante de Retencion',
                '11': 'Factura de Exportacion',
                '14': 'Factura de Sujeto Excluido',
            };
            return tipos[tipoDte] || `DTE ${tipoDte}`;
        }
        getEstadoLabel(estado) {
            const estados = {
                CREADO: 'Creado',
                FIRMADO: 'Firmado',
                PROCESADO: 'Procesado',
                RECHAZADO: 'Rechazado',
                ANULADO: 'Anulado',
            };
            return estados[estado] || estado;
        }
        formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString('es-SV', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        }
        formatCurrency(amount) {
            return `$${amount.toFixed(2)}`;
        }
        isDemoMode(dte) {
            if (dte.selloRecibido?.startsWith('DEMO'))
                return true;
            if (dte.tenant?.nit === 'DEMO')
                return true;
            const observaciones = dte.data?.observaciones;
            if (observaciones?.some((o) => o.includes('MODO DEMO')))
                return true;
            return false;
        }
        async generateInvoicePdf(dte) {
            this.logger.log(`Generating PDF for DTE ${dte.codigoGeneracion}`);
            const data = dte.data;
            const receptor = data?.receptor || {};
            const items = data?.cuerpoDocumento || [];
            const resumen = data?.resumen || {};
            const isDemoMode = this.isDemoMode(dte);
            const styles = {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10],
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 10, 0, 5],
                },
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    color: 'white',
                    fillColor: '#2563eb',
                },
                tableCell: {
                    fontSize: 9,
                },
                small: {
                    fontSize: 8,
                    color: '#666666',
                },
                demoWatermark: {
                    fontSize: 60,
                    color: '#ff000020',
                    bold: true,
                },
            };
            // Build items table
            const itemsTableBody = [
                [
                    { text: '#', style: 'tableHeader', alignment: 'center' },
                    { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
                    { text: 'Descripcion', style: 'tableHeader' },
                    { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' },
                    { text: 'Gravado', style: 'tableHeader', alignment: 'right' },
                    { text: 'IVA', style: 'tableHeader', alignment: 'right' },
                ],
            ];
            items.forEach((item, index) => {
                itemsTableBody.push([
                    { text: String(index + 1), style: 'tableCell', alignment: 'center' },
                    { text: String(item.cantidad || 1), style: 'tableCell', alignment: 'center' },
                    { text: item.descripcion || '', style: 'tableCell' },
                    { text: this.formatCurrency(item.precioUni || 0), style: 'tableCell', alignment: 'right' },
                    { text: this.formatCurrency(item.ventaGravada || 0), style: 'tableCell', alignment: 'right' },
                    { text: this.formatCurrency(item.ivaItem || 0), style: 'tableCell', alignment: 'right' },
                ]);
            });
            const content = [
                // Demo watermark
                ...(isDemoMode ? [{
                        text: 'MODO DEMO',
                        absolutePosition: { x: 150, y: 350 },
                        fontSize: 60,
                        color: '#ff000015',
                        bold: true,
                    }] : []),
                // Header
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { text: dte.tenant?.nombre || 'Empresa', style: 'header' },
                                { text: `NIT: ${dte.tenant?.nit || 'N/A'}`, style: 'small' },
                                { text: `NRC: ${dte.tenant?.nrc || 'N/A'}`, style: 'small' },
                                { text: dte.tenant?.direccion || '', style: 'small' },
                                { text: `Tel: ${dte.tenant?.telefono || 'N/A'}`, style: 'small' },
                                { text: dte.tenant?.correo || '', style: 'small' },
                            ],
                        },
                        {
                            width: 'auto',
                            stack: [
                                { text: this.getTipoDteLabel(dte.tipoDte), style: 'header', alignment: 'right' },
                                { text: `No. Control: ${dte.numeroControl}`, alignment: 'right', bold: true },
                                { text: `Codigo: ${dte.codigoGeneracion}`, alignment: 'right', style: 'small' },
                                { text: `Fecha: ${this.formatDate(dte.createdAt)}`, alignment: 'right' },
                                {
                                    text: `Estado: ${this.getEstadoLabel(dte.estado)}`,
                                    alignment: 'right',
                                    color: dte.estado === 'PROCESADO' ? '#16a34a' : dte.estado === 'RECHAZADO' ? '#dc2626' : '#666666',
                                },
                                ...(isDemoMode ? [{ text: 'DOCUMENTO DE PRUEBA', alignment: 'right', color: '#dc2626', bold: true }] : []),
                            ],
                        },
                    ],
                },
                // Separator
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 10, 0, 10] },
                // Receptor info
                {
                    text: 'DATOS DEL RECEPTOR',
                    style: 'subheader',
                },
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { text: `Nombre: ${receptor.nombre || 'Consumidor Final'}`, margin: [0, 0, 0, 2] },
                                { text: `NIT: ${receptor.nit || 'N/A'}`, style: 'small' },
                                { text: `NRC: ${receptor.nrc || 'N/A'}`, style: 'small' },
                            ],
                        },
                        {
                            width: '*',
                            stack: [
                                { text: `Direccion: ${receptor.direccion?.complemento || 'N/A'}`, style: 'small' },
                                { text: `Telefono: ${receptor.telefono || 'N/A'}`, style: 'small' },
                                { text: `Correo: ${receptor.correo || 'N/A'}`, style: 'small' },
                            ],
                        },
                    ],
                },
                // Items table
                { text: 'DETALLE', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: [25, 35, '*', 60, 60, 50],
                        body: itemsTableBody,
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#e5e7eb',
                        vLineColor: () => '#e5e7eb',
                        paddingLeft: () => 4,
                        paddingRight: () => 4,
                        paddingTop: () => 3,
                        paddingBottom: () => 3,
                    },
                },
                // Totals
                {
                    margin: [0, 20, 0, 0],
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 200,
                            table: {
                                widths: ['*', 80],
                                body: [
                                    [{ text: 'Subtotal Gravado:', alignment: 'right' }, { text: this.formatCurrency(resumen.totalGravada || 0), alignment: 'right' }],
                                    [{ text: 'Subtotal Exento:', alignment: 'right' }, { text: this.formatCurrency(resumen.totalExenta || 0), alignment: 'right' }],
                                    [{ text: 'IVA (13%):', alignment: 'right' }, { text: this.formatCurrency(resumen.ivaRete1 || 0), alignment: 'right' }],
                                    [{ text: 'TOTAL:', alignment: 'right', bold: true, fontSize: 12 }, { text: this.formatCurrency(resumen.totalPagar || resumen.montoTotalOperacion || 0), alignment: 'right', bold: true, fontSize: 12 }],
                                ],
                            },
                            layout: 'noBorders',
                        },
                    ],
                },
                // Total in words
                resumen.totalLetras ? {
                    margin: [0, 10, 0, 0],
                    text: `Son: ${resumen.totalLetras}`,
                    italics: true,
                    fontSize: 9,
                } : null,
                // Sello recibido (if processed)
                dte.selloRecibido ? {
                    margin: [0, 30, 0, 0],
                    stack: [
                        { text: 'INFORMACION DE HACIENDA', style: 'subheader' },
                        { text: `Sello de Recepcion: ${dte.selloRecibido}`, style: 'small' },
                        { text: `Fecha Procesamiento: ${dte.fhProcesamiento ? this.formatDate(dte.fhProcesamiento) : 'N/A'}`, style: 'small' },
                        ...(isDemoMode ? [{ text: 'Este documento fue generado en MODO DEMO y no tiene validez fiscal.', color: '#dc2626', fontSize: 9, margin: [0, 5, 0, 0] }] : []),
                    ],
                } : null,
            ].filter(Boolean);
            const docDefinition = {
                content,
                styles,
                defaultStyle: {
                    font: 'Roboto',
                },
                pageSize: 'LETTER',
                pageMargins: [40, 40, 40, 60],
                footer: (currentPage, pageCount) => ({
                    columns: [
                        { text: isDemoMode ? 'DOCUMENTO DE PRUEBA - SIN VALIDEZ FISCAL' : 'Documento Tributario Electronico', alignment: 'left', style: 'small', margin: [40, 0, 0, 0] },
                        { text: `Pagina ${currentPage} de ${pageCount}`, alignment: 'right', style: 'small', margin: [0, 0, 40, 0] },
                    ],
                }),
            };
            return new Promise((resolve, reject) => {
                try {
                    // Use pdfmake's virtual file system approach
                    const pdfMake = require('pdfmake/build/pdfmake');
                    const pdfFonts = require('pdfmake/build/vfs_fonts');
                    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;
                    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
                    pdfDocGenerator.getBuffer((buffer) => {
                        resolve(buffer);
                    });
                }
                catch (error) {
                    this.logger.error(`Error generating PDF: ${error}`);
                    reject(error);
                }
            });
        }
    };
    return PdfService = _classThis;
})();
exports.PdfService = PdfService;
