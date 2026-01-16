import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TipoDte,
  Ambiente,
  Identificacion,
  Emisor,
  ReceptorFactura,
  ReceptorCCF,
  CuerpoDocumentoFactura,
  CuerpoDocumentoCCF,
  ResumenFactura,
  ResumenCCF,
  FacturaElectronica,
  ComprobanteCreditoFiscal,
  DTE_VERSIONS,
  Pago,
  TributoResumen,
} from '@facturador/shared';

export interface BuildFacturaInput {
  emisor: Omit<Emisor, 'direccion'> & { direccion: Emisor['direccion'] };
  receptor?: ReceptorFactura;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: 1 | 2 | 3;
}

export interface BuildCCFInput {
  emisor: Omit<Emisor, 'direccion'> & { direccion: Emisor['direccion'] };
  receptor: ReceptorCCF;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: 1 | 2 | 3;
}

@Injectable()
export class DteBuilderService {
  private readonly IVA_RATE = 0.13;

  generateCodigoGeneracion(): string {
    return randomUUID().toUpperCase();
  }

  generateNumeroControl(
    tipoDte: TipoDte,
    codEstablecimiento: string,
    correlativo: number
  ): string {
    const codEstab = codEstablecimiento.padStart(8, '0').slice(0, 8);
    const corr = correlativo.toString().padStart(15, '0').slice(0, 15);
    return `DTE-${tipoDte}-${codEstab}-${corr}`;
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    return new Date().toTimeString().split(' ')[0];
  }

  private roundTo2Decimals(num: number): number {
    return Math.round(num * 100) / 100;
  }

  private numberToWords(num: number): string {
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    const convertGroup = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        const ten = Math.floor(n / 10);
        const unit = n % 10;
        if (n === 20) return 'VEINTE';
        if (n < 30) return 'VEINTI' + units[unit];
        return tens[ten] + (unit ? ' Y ' + units[unit] : '');
      }
      if (n === 100) return 'CIEN';
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return hundreds[hundred] + (rest ? ' ' + convertGroup(rest) : '');
    };

    let result = '';
    if (intPart === 0) {
      result = 'CERO';
    } else if (intPart >= 1000000) {
      const millions = Math.floor(intPart / 1000000);
      const rest = intPart % 1000000;
      result = (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') +
        (rest ? ' ' + this.convertThousands(rest, convertGroup) : '');
    } else {
      result = this.convertThousands(intPart, convertGroup);
    }

    return `${result} ${decPart.toString().padStart(2, '0')}/100 USD`;
  }

  private convertThousands(n: number, convertGroup: (n: number) => string): string {
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      const rest = n % 1000;
      return (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') +
        (rest ? ' ' + convertGroup(rest) : '');
    }
    return convertGroup(n);
  }

  buildFactura(input: BuildFacturaInput): FacturaElectronica {
    const tipoDte: TipoDte = '01';
    const ambiente = input.ambiente || '00';
    const codigoGeneracion = this.generateCodigoGeneracion();
    const numeroControl = this.generateNumeroControl(tipoDte, input.codEstablecimiento, input.correlativo);

    const identificacion: Identificacion = {
      version: DTE_VERSIONS[tipoDte],
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

    const cuerpoDocumento: CuerpoDocumentoFactura[] = input.items.map((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const esGravado = item.esGravado !== false && !item.esExento;
      const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
      const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;
      const ivaItem = esGravado ? this.roundTo2Decimals(ventaGravada * this.IVA_RATE) : 0;

      return {
        numItem: index + 1,
        tipoItem: 1 as const,
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

    const tributos: TributoResumen[] | null = totalGravada > 0 ? [{
      codigo: '20',
      descripcion: 'Impuesto al Valor Agregado 13%',
      valor: totalIva,
    }] : null;

    const pagos: Pago[] | null = input.condicionOperacion !== 2 ? [{
      codigo: '01',
      montoPago: montoTotalOperacion,
      referencia: null,
      plazo: null,
      periodo: null,
    }] : null;

    const resumen: ResumenFactura = {
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

  buildCCF(input: BuildCCFInput): ComprobanteCreditoFiscal {
    const tipoDte: TipoDte = '03';
    const ambiente = input.ambiente || '00';
    const codigoGeneracion = this.generateCodigoGeneracion();
    const numeroControl = this.generateNumeroControl(tipoDte, input.codEstablecimiento, input.correlativo);

    const identificacion: Identificacion = {
      version: DTE_VERSIONS[tipoDte],
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

    const cuerpoDocumento: CuerpoDocumentoCCF[] = input.items.map((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const esGravado = item.esGravado !== false && !item.esExento;
      const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
      const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;

      return {
        numItem: index + 1,
        tipoItem: 1 as const,
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

    const tributos: TributoResumen[] | null = totalGravada > 0 ? [{
      codigo: '20',
      descripcion: 'Impuesto al Valor Agregado 13%',
      valor: this.roundTo2Decimals(totalGravada * this.IVA_RATE),
    }] : null;

    const ivaTotal = tributos ? tributos[0].valor : 0;
    const montoTotalOperacion = this.roundTo2Decimals(subTotalVentas + ivaTotal);

    const pagos: Pago[] | null = input.condicionOperacion !== 2 ? [{
      codigo: '01',
      montoPago: montoTotalOperacion,
      referencia: null,
      plazo: null,
      periodo: null,
    }] : null;

    const resumen: ResumenCCF = {
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
}
