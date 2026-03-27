import { Injectable, Logger, Optional } from '@nestjs/common';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import * as QRCode from 'qrcode';
import { DEPARTAMENTOS } from '@facturador/shared';
import { TemplateRenderService } from '../invoice-templates/template-render.service';

interface Identificacion {
  ambiente?: string;
  fecEmi?: string;
  codigoGeneracion?: string;
}

export interface DteData {
  id: string;
  tenantId?: string;
  codigoGeneracion: string;
  numeroControl: string;
  tipoDte: string;
  estado: string;
  selloRecibido?: string;
  fhProcesamiento?: Date;
  data: Record<string, unknown>;
  createdAt: Date;
  tenant?: {
    nombre: string;
    nit: string;
    nrc: string;
    direccion?: string;
    telefono: string;
    correo: string;
    logoUrl?: string | null;
  };
}

interface Receptor {
  nombre?: string;
  nit?: string;
  nrc?: string;
  telefono?: string;
  correo?: string;
  direccion?: {
    departamento?: string;
    municipio?: string;
    complemento?: string;
  };
}

interface CuerpoDocumento {
  numItem?: number;
  cantidad?: number;
  codigo?: string;
  descripcion?: string;
  precioUni?: number;
  ventaGravada?: number;
  ventaExenta?: number;
  ventaNoSuj?: number;
  ivaItem?: number;
}

interface Resumen {
  totalGravada?: number;
  totalExenta?: number;
  totalNoSuj?: number;
  subTotal?: number;
  ivaRete1?: number;
  montoTotalOperacion?: number;
  totalPagar?: number;
  totalLetras?: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @Optional() private readonly templateRenderService?: TemplateRenderService,
  ) {}

  private getTipoDteLabel(tipoDte: string): string {
    const tipos: Record<string, string> = {
      '01': 'Factura',
      '03': 'Comprobante de Crédito Fiscal',
      '05': 'Nota de Crédito',
      '06': 'Nota de Débito',
      '07': 'Comprobante de Retención',
      '11': 'Factura de Exportación',
      '14': 'Factura de Sujeto Excluido',
    };
    return tipos[tipoDte] || `DTE ${tipoDte}`;
  }

  private getEstadoLabel(estado: string): string {
    const estados: Record<string, string> = {
      CREADO: 'Creado',
      FIRMADO: 'Firmado',
      PROCESADO: 'Procesado',
      RECHAZADO: 'Rechazado',
      ANULADO: 'Anulado',
    };
    return estados[estado] || estado;
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-SV', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format a structured address (departamento code, municipio code, complemento)
   * into a human-readable string.
   */
  private formatDireccion(direccion?: { departamento?: string; municipio?: string; complemento?: string }): string {
    if (!direccion) return 'N/A';

    const parts: string[] = [];

    if (direccion.complemento) {
      parts.push(direccion.complemento);
    }

    if (direccion.municipio) {
      parts.push(direccion.municipio);
    }

    const deptoName = direccion.departamento ? (DEPARTAMENTOS[direccion.departamento] || direccion.departamento) : '';
    if (deptoName) {
      parts.push(deptoName);
    }

    if (parts.length === 0) return 'N/A';
    return parts.join(', ');
  }

  /**
   * Parse tenant.direccion which may be a JSON string or structured object.
   */
  private parseTenantDireccion(direccion?: string): string {
    if (!direccion) return 'N/A';
    try {
      const parsed = JSON.parse(direccion);
      if (typeof parsed === 'object' && parsed !== null) {
        const dir = parsed as { departamento?: string; municipio?: string; complemento?: string };
        const result = this.formatDireccion(dir);
        return result || 'N/A';
      }
      return direccion || 'N/A';
    } catch {
      // If not JSON, return as plain string
      return direccion || 'N/A';
    }
  }

  /**
   * Extract IVA amount from resumen, checking totalIva, tributos array, and ivaRete1.
   */
  private getIvaAmount(resumen: Resumen, data: Record<string, unknown>): number {
    // First check if totalIva is available (Factura type 01)
    const totalIva = (resumen as Record<string, unknown>).totalIva;
    if (typeof totalIva === 'number' && totalIva > 0) return totalIva;

    // Check tributos array for IVA code '20'
    const tributos = (resumen as Record<string, unknown>).tributos;
    if (Array.isArray(tributos)) {
      const ivaTributo = tributos.find((t: Record<string, unknown>) => t.codigo === '20');
      if (ivaTributo && typeof ivaTributo.valor === 'number') return ivaTributo.valor;
    }

    // Check data-level tributos
    const dataTributos = (data as Record<string, unknown>).tributos;
    if (Array.isArray(dataTributos)) {
      const ivaTributo = dataTributos.find((t: Record<string, unknown>) => t.codigo === '20');
      if (ivaTributo && typeof ivaTributo.valor === 'number') return ivaTributo.valor;
    }

    // Fallback to ivaRete1
    if (typeof resumen.ivaRete1 === 'number' && resumen.ivaRete1 > 0) return resumen.ivaRete1;

    // Calculate IVA from individual items (sum of ivaItem)
    const cuerpoDocumento = (data as { cuerpoDocumento?: CuerpoDocumento[] })?.cuerpoDocumento;
    if (Array.isArray(cuerpoDocumento)) {
      const totalIvaItems = cuerpoDocumento.reduce((sum, item) => sum + (item.ivaItem || 0), 0);
      if (totalIvaItems > 0) return Math.round(totalIvaItems * 100) / 100;
    }

    // Calculate from totalGravada (13% standard IVA)
    if (typeof resumen.totalGravada === 'number' && resumen.totalGravada > 0) {
      // Try difference method first
      if (typeof resumen.montoTotalOperacion === 'number') {
        const subTotal = (resumen.totalGravada || 0) + (resumen.totalExenta || 0) + (resumen.totalNoSuj || 0);
        if (resumen.montoTotalOperacion > subTotal) {
          return Math.round((resumen.montoTotalOperacion - subTotal) * 100) / 100;
        }
      }
      // Fallback: calculate 13% of totalGravada
      return Math.round(resumen.totalGravada * 0.13 * 100) / 100;
    }

    return 0;
  }

  private isDemoMode(dte: DteData): boolean {
    if (dte.selloRecibido?.startsWith('DEMO')) return true;
    if (dte.tenant?.nit === 'DEMO') return true;
    const observaciones = (dte.data as { observaciones?: string[] })?.observaciones;
    if (observaciones?.some((o: string) => o.includes('MODO DEMO'))) return true;
    return false;
  }

  /**
   * Fetch a remote image and return as base64 data URL for pdfmake.
   */
  private async fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.warn(`Failed to fetch logo from ${url}: ${error}`);
      return null;
    }
  }

  /**
   * Generate QR code as base64 data URL for the Hacienda consultation URL.
   */
  private async generateQrDataUrl(dte: DteData): Promise<string | null> {
    try {
      const identificacion = (dte.data as { identificacion?: Identificacion })?.identificacion;
      const ambiente = identificacion?.ambiente || '00';
      const fecEmi = identificacion?.fecEmi || dte.createdAt.toISOString().split('T')[0];

      const url = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${dte.codigoGeneracion}&fechaEmi=${fecEmi}`;

      const dataUrl = await QRCode.toDataURL(url, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      return dataUrl;
    } catch (error) {
      this.logger.error(`Error generating QR code: ${error}`);
      return null;
    }
  }

  async generateInvoicePdf(dte: DteData): Promise<Buffer> {
    this.logger.log(`Generating PDF for DTE ${dte.codigoGeneracion}`);

    // Try template-based generation if available
    if (this.templateRenderService && dte.tenantId) {
      try {
        const resolved = await this.templateRenderService.resolveTemplate(dte.tenantId, dte.tipoDte);
        if (resolved) {
          this.logger.log(`Using template "${resolved.id}" for DTE ${dte.codigoGeneracion}`);
          const html = await this.templateRenderService.compileHtmlFromTemplate(
            resolved.htmlTemplate,
            resolved.config,
            dte,
          );
          return await this.templateRenderService.generatePdf(html, resolved.config.pageSettings);
        }
      } catch (error) {
        this.logger.error(
          `Template PDF generation failed for DTE ${dte.codigoGeneracion}, falling back to legacy: ${error}`,
        );
      }
    }

    return this.generateLegacyPdf(dte);
  }

  private async generateLegacyPdf(dte: DteData): Promise<Buffer> {

    const data = dte.data as {
      identificacion?: Identificacion;
      receptor?: Receptor;
      cuerpoDocumento?: CuerpoDocumento[];
      resumen?: Resumen;
    };

    const receptor = data?.receptor || {};
    const items = data?.cuerpoDocumento || [];
    const resumen = data?.resumen || {};
    const isDemoMode = this.isDemoMode(dte);

    // Generate QR code and fetch logo in parallel
    const [qrDataUrl, logoDataUrl] = await Promise.all([
      this.generateQrDataUrl(dte),
      dte.tenant?.logoUrl ? this.fetchImageAsDataUrl(dte.tenant.logoUrl) : Promise.resolve(null),
    ]);

    const styles: StyleDictionary = {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
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
    const itemsTableBody: Content[][] = [
      [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
        { text: 'Descripción', style: 'tableHeader' },
        { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' },
        { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
        { text: 'IVA (13%)', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    items.forEach((item, index) => {
      const ventaGravada = item.ventaGravada || 0;
      const ventaExenta = item.ventaExenta || 0;
      const ventaNoSuj = item.ventaNoSuj || 0;
      const subtotalItem = ventaGravada || ventaExenta || ventaNoSuj;
      const ivaItem = item.ivaItem || 0;

      itemsTableBody.push([
        { text: String(index + 1), style: 'tableCell', alignment: 'center' },
        { text: String(item.cantidad || 1), style: 'tableCell', alignment: 'center' },
        { text: item.descripcion || '', style: 'tableCell' },
        { text: this.formatCurrency(item.precioUni || 0), style: 'tableCell', alignment: 'right' },
        { text: this.formatCurrency(subtotalItem), style: 'tableCell', alignment: 'right' },
        { text: ivaItem > 0 ? this.formatCurrency(ivaItem) : '-', style: 'tableCell', alignment: 'right' },
      ]);
    });

    const content: Content[] = [
      // Demo watermark
      ...(isDemoMode ? [{
        text: 'MODO DEMO',
        absolutePosition: { x: 150, y: 350 },
        fontSize: 60,
        color: '#ff000015',
        bold: true,
      } as Content] : []),

      // Header with optional logo
      {
        columns: [
          {
            width: '*',
            stack: [
              ...(logoDataUrl ? [
                { image: logoDataUrl, width: 120, height: 50, margin: [0, 0, 0, 5] as [number, number, number, number] },
              ] as Content[] : []),
              { text: dte.tenant?.nombre || 'Empresa', style: 'header' },
              { text: `NIT: ${dte.tenant?.nit || 'N/A'}`, style: 'small' },
              { text: `NRC: ${dte.tenant?.nrc || 'N/A'}`, style: 'small' },
              { text: this.parseTenantDireccion(dte.tenant?.direccion), style: 'small' },
              { text: `Tel: ${dte.tenant?.telefono || 'N/A'}`, style: 'small' },
              { text: dte.tenant?.correo || '', style: 'small' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: this.getTipoDteLabel(dte.tipoDte), style: 'header', alignment: 'right' },
              { text: `No. Control: ${dte.numeroControl}`, alignment: 'right', bold: true },
              { text: `Código: ${dte.codigoGeneracion}`, alignment: 'right', style: 'small' },
              { text: `Fecha: ${this.formatDate(dte.createdAt)}`, alignment: 'right' },
              {
                text: `Estado: ${this.getEstadoLabel(dte.estado)}`,
                alignment: 'right',
                color: dte.estado === 'PROCESADO' ? '#16a34a' : dte.estado === 'RECHAZADO' ? '#dc2626' : '#666666',
              },
              ...(isDemoMode ? [{ text: 'DOCUMENTO DE PRUEBA', alignment: 'right' as const, color: '#dc2626', bold: true }] : []),
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
              { text: `Dirección: ${this.formatDireccion(receptor.direccion)}`, style: 'small' },
              { text: `Teléfono: ${receptor.telefono || 'N/A'}`, style: 'small' },
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
        margin: [0, 20, 0, 0] as [number, number, number, number],
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 80],
              body: [
                [{ text: 'Subtotal Gravado:', alignment: 'right' as const }, { text: this.formatCurrency(resumen.totalGravada || 0), alignment: 'right' as const }],
                ...((resumen.totalExenta || 0) > 0 ? [[{ text: 'Subtotal Exento:', alignment: 'right' as const }, { text: this.formatCurrency(resumen.totalExenta || 0), alignment: 'right' as const }]] : []),
                ...((resumen.totalNoSuj || 0) > 0 ? [[{ text: 'Subtotal No Sujeto:', alignment: 'right' as const }, { text: this.formatCurrency(resumen.totalNoSuj || 0), alignment: 'right' as const }]] : []),
                [{ text: 'IVA (13%):', alignment: 'right' as const }, { text: this.formatCurrency(this.getIvaAmount(resumen, dte.data)), alignment: 'right' as const }],
                [{ text: 'TOTAL:', alignment: 'right' as const, bold: true, fontSize: 12 }, { text: this.formatCurrency(resumen.totalPagar || resumen.montoTotalOperacion || 0), alignment: 'right' as const, bold: true, fontSize: 12 }],
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
          { text: 'INFORMACIÓN DE HACIENDA', style: 'subheader' },
          { text: `Sello de Recepción: ${dte.selloRecibido}`, style: 'small' },
          { text: `Fecha Procesamiento: ${dte.fhProcesamiento ? this.formatDate(dte.fhProcesamiento) : 'N/A'}`, style: 'small' },
          ...(isDemoMode ? [{ text: 'Este documento fue generado en MODO DEMO y no tiene validez fiscal.', color: '#dc2626', fontSize: 9, margin: [0, 5, 0, 0] as [number, number, number, number] }] : []),
        ],
      } : null,

      // QR Code for Hacienda verification
      qrDataUrl ? {
        margin: [0, 20, 0, 0] as [number, number, number, number],
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { image: qrDataUrl, width: 120, height: 120, alignment: 'center' as const },
              { text: 'Consulta pública - Ministerio de Hacienda', style: 'small', alignment: 'center' as const, margin: [0, 4, 0, 0] as [number, number, number, number] },
            ],
          },
          { width: '*', text: '' },
        ],
      } : null,
    ].filter(Boolean) as Content[];

    const docDefinition: TDocumentDefinitions = {
      content,
      styles,
      defaultStyle: {
        font: 'Roboto',
      },
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 60],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: isDemoMode ? 'DOCUMENTO DE PRUEBA - SIN VALIDEZ FISCAL' : 'Documento Tributario Electrónico', alignment: 'left', style: 'small', margin: [40, 0, 0, 0] },
          { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', style: 'small', margin: [0, 0, 40, 0] },
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
        pdfDocGenerator.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      } catch (error) {
        this.logger.error(`Error generating PDF: ${error}`);
        reject(error);
      }
    });
  }
}
