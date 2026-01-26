import { Injectable, Logger } from '@nestjs/common';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';

interface DteData {
  id: string;
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

  private getTipoDteLabel(tipoDte: string): string {
    const tipos: Record<string, string> = {
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

  private isDemoMode(dte: DteData): boolean {
    if (dte.selloRecibido?.startsWith('DEMO')) return true;
    if (dte.tenant?.nit === 'DEMO') return true;
    const observaciones = (dte.data as { observaciones?: string[] })?.observaciones;
    if (observaciones?.some((o: string) => o.includes('MODO DEMO'))) return true;
    return false;
  }

  async generateInvoicePdf(dte: DteData): Promise<Buffer> {
    this.logger.log(`Generating PDF for DTE ${dte.codigoGeneracion}`);

    const data = dte.data as {
      receptor?: Receptor;
      cuerpoDocumento?: CuerpoDocumento[];
      resumen?: Resumen;
    };

    const receptor = data?.receptor || {};
    const items = data?.cuerpoDocumento || [];
    const resumen = data?.resumen || {};
    const isDemoMode = this.isDemoMode(dte);

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

    const content: Content[] = [
      // Demo watermark
      ...(isDemoMode ? [{
        text: 'MODO DEMO',
        absolutePosition: { x: 150, y: 350 },
        fontSize: 60,
        color: '#ff000015',
        bold: true,
      } as Content] : []),

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
        margin: [0, 20, 0, 0] as [number, number, number, number],
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 80],
              body: [
                [{ text: 'Subtotal Gravado:', alignment: 'right' as const }, { text: this.formatCurrency(resumen.totalGravada || 0), alignment: 'right' as const }],
                [{ text: 'Subtotal Exento:', alignment: 'right' as const }, { text: this.formatCurrency(resumen.totalExenta || 0), alignment: 'right' as const }],
                [{ text: 'IVA (13%):', alignment: 'right' as const }, { text: this.formatCurrency(resumen.ivaRete1 || 0), alignment: 'right' as const }],
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
          { text: 'INFORMACION DE HACIENDA', style: 'subheader' },
          { text: `Sello de Recepcion: ${dte.selloRecibido}`, style: 'small' },
          { text: `Fecha Procesamiento: ${dte.fhProcesamiento ? this.formatDate(dte.fhProcesamiento) : 'N/A'}`, style: 'small' },
          ...(isDemoMode ? [{ text: 'Este documento fue generado en MODO DEMO y no tiene validez fiscal.', color: '#dc2626', fontSize: 9, margin: [0, 5, 0, 0] as [number, number, number, number] }] : []),
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
