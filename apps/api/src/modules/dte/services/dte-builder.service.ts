import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TipoDte,
  Ambiente,
  CondicionOperacion,
  Identificacion,
  Emisor,
  ReceptorFactura,
  ReceptorCCF,
  ReceptorSujetoExcluido,
  ReceptorNotaRemision,
  ReceptorLiquidacion,
  ReceptorExportacion,
  EmisorExportacion,
  EmisorLiquidacion,
  DocumentoRelacionado,
  CuerpoDocumentoFactura,
  CuerpoDocumentoCCF,
  CuerpoDocumentoNotaCredito,
  CuerpoDocumentoRetencion,
  CuerpoDocumentoSujetoExcluido,
  CuerpoDocumentoLiquidacion,
  CuerpoDocumentoExportacion,
  ResumenFactura,
  ResumenCCF,
  ResumenNotaCredito,
  ResumenRetencion,
  ResumenSujetoExcluido,
  ResumenNotaRemision,
  ResumenExportacion,
  ExtensionLiquidacion,
  FacturaElectronica,
  ComprobanteCreditoFiscal,
  NotaCredito,
  NotaDebito,
  ComprobanteRetencion,
  FacturaSujetoExcluido,
  NotaRemision,
  DocumentoContableLiquidacion,
  FacturaExportacion,
  OtroDocumentoExportacion,
  DTE_VERSIONS,
  Pago,
  TributoResumen,
  TipoImpuestoRetencion,
  RetencionItem,
  ResumenCRS,
  ComprobanteCRS,
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

export interface BuildNotaCreditoInput {
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  documentoRelacionado: DocumentoRelacionado[];
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
    numeroDocumento: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: CondicionOperacion;
}

export interface BuildNotaDebitoInput {
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  documentoRelacionado: DocumentoRelacionado[];
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
    numeroDocumento: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: CondicionOperacion;
}

export interface BuildComprobanteRetencionInput {
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  items: Array<{
    tipoDte: string;
    tipoDoc: 1 | 2;
    numDocumento: string;
    fechaEmision: string;
    montoSujetoGrav: number;
    codigoRetencionMH: string;
    ivaRetenido: number;
    descripcion: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
}

export interface BuildSujetoExcluidoInput {
  emisor: Emisor;
  sujetoExcluido: ReceptorSujetoExcluido;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigo?: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: CondicionOperacion;
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
    const ambiente = input.ambiente ?? '00';
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
    const ambiente = input.ambiente ?? '00';
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

  buildNotaCredito(input: BuildNotaCreditoInput): NotaCredito {
    const tipoDte: TipoDte = '05';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: CuerpoDocumentoNotaCredito[] = input.items.map((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const esGravado = item.esGravado !== false && !item.esExento;
      const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
      const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;

      return {
        numItem: index + 1,
        tipoItem: 1 as const,
        numeroDocumento: item.numeroDocumento,
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

    const resumen: ResumenNotaCredito = {
      totalNoSuj,
      totalExenta,
      totalGravada,
      subTotalVentas,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: 0,
      totalDescu: 0,
      tributos,
      subTotal: subTotalVentas,
      ivaPerci1: 0,
      ivaRete1: 0,
      reteRenta: 0,
      montoTotalOperacion,
      totalLetras: this.numberToWords(montoTotalOperacion),
      condicionOperacion: input.condicionOperacion || 1,
    };

    return {
      identificacion,
      documentoRelacionado: input.documentoRelacionado,
      emisor: input.emisor,
      receptor: input.receptor,
      ventaTercero: null,
      cuerpoDocumento,
      resumen,
      extension: null,
      apendice: null,
    };
  }

  buildNotaDebito(input: BuildNotaDebitoInput): NotaDebito {
    const tipoDte: TipoDte = '06';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: CuerpoDocumentoNotaCredito[] = input.items.map((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const esGravado = item.esGravado !== false && !item.esExento;
      const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
      const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;

      return {
        numItem: index + 1,
        tipoItem: 1 as const,
        numeroDocumento: item.numeroDocumento,
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

    const resumen: ResumenNotaCredito & { numPagoElectronico: string | null } = {
      totalNoSuj,
      totalExenta,
      totalGravada,
      subTotalVentas,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: 0,
      totalDescu: 0,
      tributos,
      subTotal: subTotalVentas,
      ivaPerci1: 0,
      ivaRete1: 0,
      reteRenta: 0,
      montoTotalOperacion,
      totalLetras: this.numberToWords(montoTotalOperacion),
      condicionOperacion: input.condicionOperacion || 1,
      numPagoElectronico: null,
    };

    return {
      identificacion,
      documentoRelacionado: input.documentoRelacionado,
      emisor: input.emisor,
      receptor: input.receptor,
      ventaTercero: null,
      cuerpoDocumento,
      resumen,
      extension: null,
      apendice: null,
    };
  }

  buildComprobanteRetencion(input: BuildComprobanteRetencionInput): ComprobanteRetencion {
    const tipoDte: TipoDte = '07';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: CuerpoDocumentoRetencion[] = input.items.map((item, index) => ({
      numItem: index + 1,
      tipoDte: item.tipoDte,
      tipoDoc: item.tipoDoc,
      numDocumento: item.numDocumento,
      fechaEmision: item.fechaEmision,
      montoSujetoGrav: this.roundTo2Decimals(item.montoSujetoGrav),
      codigoRetencionMH: item.codigoRetencionMH,
      ivaRetenido: this.roundTo2Decimals(item.ivaRetenido),
      descripcion: item.descripcion,
    }));

    const totalSujetoRetencion = this.roundTo2Decimals(
      cuerpoDocumento.reduce((sum, item) => sum + item.montoSujetoGrav, 0),
    );
    const totalIVAretenido = this.roundTo2Decimals(
      cuerpoDocumento.reduce((sum, item) => sum + item.ivaRetenido, 0),
    );

    const resumen: ResumenRetencion = {
      totalSujetoRetencion,
      totalIVAretenido,
      totalIVAretenidoLetras: this.numberToWords(totalIVAretenido),
    };

    return {
      identificacion,
      emisor: input.emisor,
      receptor: input.receptor,
      cuerpoDocumento,
      resumen,
      extension: null,
      apendice: null,
    };
  }

  buildSujetoExcluido(input: BuildSujetoExcluidoInput): FacturaSujetoExcluido {
    const tipoDte: TipoDte = '14';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: CuerpoDocumentoSujetoExcluido[] = input.items.map((item, index) => {
      const compra = this.roundTo2Decimals(item.cantidad * item.precioUnitario);
      return {
        numItem: index + 1,
        tipoItem: 1 as const,
        cantidad: item.cantidad,
        codigo: item.codigo || null,
        uniMedida: 59,
        descripcion: item.descripcion,
        precioUni: item.precioUnitario,
        montoDescu: 0,
        compra,
      };
    });

    const totalCompra = this.roundTo2Decimals(
      cuerpoDocumento.reduce((sum, item) => sum + item.compra, 0),
    );

    const pagos: Pago[] | null = input.condicionOperacion !== 2 ? [{
      codigo: '01',
      montoPago: totalCompra,
      referencia: null,
      plazo: null,
      periodo: null,
    }] : null;

    const resumen: ResumenSujetoExcluido = {
      totalCompra,
      descu: 0,
      totalDescu: 0,
      subTotal: totalCompra,
      ivaRete1: 0,
      reteRenta: 0,
      totalPagar: totalCompra,
      totalLetras: this.numberToWords(totalCompra),
      condicionOperacion: input.condicionOperacion || 1,
      pagos,
      observaciones: null,
    };

    return {
      identificacion,
      emisor: input.emisor,
      sujetoExcluido: input.sujetoExcluido,
      cuerpoDocumento,
      resumen,
      apendice: null,
    };
  }

  // === Tipo 04: Nota de Remisión ===

  buildNotaRemision(input: BuildNotaRemisionInput): NotaRemision {
    const tipoDte: TipoDte = '04';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: CuerpoDocumentoNotaCredito[] = input.items.map((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const esGravado = item.esGravado !== false && !item.esExento;
      const ventaGravada = esGravado ? this.roundTo2Decimals(subtotal) : 0;
      const ventaExenta = item.esExento ? this.roundTo2Decimals(subtotal) : 0;

      return {
        numItem: index + 1,
        tipoItem: 1 as const,
        numeroDocumento: item.numeroDocumento || '',
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

    const resumen: ResumenNotaRemision = {
      totalNoSuj,
      totalExenta,
      totalGravada,
      subTotalVentas,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: 0,
      porcentajeDescuento: null,
      totalDescu: 0,
      tributos,
      subTotal: subTotalVentas,
      montoTotalOperacion,
      totalLetras: this.numberToWords(montoTotalOperacion),
    };

    return {
      identificacion,
      documentoRelacionado: input.documentoRelacionado || null,
      emisor: input.emisor,
      receptor: input.receptor,
      ventaTercero: null,
      cuerpoDocumento,
      resumen,
      extension: null,
      apendice: null,
    };
  }

  // === Tipo 09: Documento Contable de Liquidación ===

  buildDocumentoLiquidacion(input: BuildDocumentoLiquidacionInput): DocumentoContableLiquidacion {
    const tipoDte: TipoDte = '09';
    const ambiente = input.ambiente ?? '00';
    const codigoGeneracion = this.generateCodigoGeneracion();
    const numeroControl = this.generateNumeroControl(tipoDte, input.codEstablecimiento, input.correlativo);

    const identificacion = {
      version: DTE_VERSIONS[tipoDte],
      ambiente,
      tipoDte,
      numeroControl,
      codigoGeneracion,
      tipoModelo: 1 as const,
      tipoOperacion: 1 as const,
      fecEmi: this.getCurrentDate(),
      horEmi: this.getCurrentTime(),
      tipoMoneda: 'USD' as const,
    };

    const IVA_RATE_DCL = 0.13;
    const iva = this.roundTo2Decimals(input.valorOperaciones * IVA_RATE_DCL);
    const subTotal = this.roundTo2Decimals(input.valorOperaciones + iva);
    const PERCEPCION_RATE = 0.02;
    const montoSujetoPercepcion = this.roundTo2Decimals(input.valorOperaciones);
    const ivaPercibido = this.roundTo2Decimals(montoSujetoPercepcion * PERCEPCION_RATE);
    const comision = this.roundTo2Decimals(input.comision || 0);
    const ivaComision = this.roundTo2Decimals(comision * IVA_RATE_DCL);
    const liquidoApagar = this.roundTo2Decimals(subTotal - ivaPercibido - comision - ivaComision);

    const cuerpoDocumento: CuerpoDocumentoLiquidacion = {
      periodoLiquidacionFechaInicio: input.periodoInicio,
      periodoLiquidacionFechaFin: input.periodoFin,
      codLiquidacion: input.codLiquidacion || null,
      cantidadDoc: input.cantidadDoc || null,
      valorOperaciones: input.valorOperaciones,
      montoSinPercepcion: input.montoSinPercepcion || 0,
      descripSinPercepcion: input.descripSinPercepcion || null,
      subTotal,
      iva,
      montoSujetoPercepcion,
      ivaPercibido,
      comision,
      porcentComision: input.porcentComision || null,
      ivaComision,
      liquidoApagar,
      totalLetras: this.numberToWords(liquidoApagar),
      observaciones: input.observaciones || null,
    };

    return {
      identificacion,
      emisor: input.emisor,
      receptor: input.receptor,
      cuerpoDocumento,
      extension: input.extension,
      apendice: null,
    };
  }

  // === Tipo 34: Comprobante de Retención Simplificado (CRS) ===

  buildCRS(input: BuildCRSInput): ComprobanteCRS {
    const tipoDte: TipoDte = '34';
    const ambiente = input.ambiente ?? '00';
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

    const cuerpoDocumento: RetencionItem[] = input.retenciones.map((ret, index) => ({
      numItem: index + 1,
      tipoImpuesto: ret.tipoImpuesto,
      descripcion: ret.descripcion,
      tasa: ret.tasa,
      montoSujetoRetencion: this.roundTo2Decimals(ret.montoSujetoRetencion),
      montoRetencion: this.roundTo2Decimals(ret.montoRetencion),
    }));

    const totalSujetoRetencion = this.roundTo2Decimals(
      cuerpoDocumento.reduce((sum, item) => sum + item.montoSujetoRetencion, 0),
    );
    const totalRetenido = this.roundTo2Decimals(
      cuerpoDocumento.reduce((sum, item) => sum + item.montoRetencion, 0),
    );

    // Validate total matches sum of retenciones
    if (Math.abs(totalRetenido - input.montoTotalRetencion) > 0.01) {
      throw new Error(
        `Monto total retención (${input.montoTotalRetencion}) no coincide con suma de retenciones (${totalRetenido})`,
      );
    }

    const resumen: ResumenCRS = {
      totalSujetoRetencion,
      totalRetenido,
      totalRetenidoLetras: this.numberToWords(totalRetenido),
    };

    return {
      identificacion,
      emisor: input.emisor,
      receptor: input.receptor,
      documentoRelacionado: input.documentoRelacionado || null,
      cuerpoDocumento,
      resumen,
      extension: null,
      apendice: null,
    };
  }

  // === Tipo 11: Factura de Exportación ===

  buildFacturaExportacion(input: BuildFacturaExportacionInput): FacturaExportacion {
    const tipoDte: TipoDte = '11';
    const ambiente = input.ambiente ?? '00';
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

    // Export items: 0% IVA, uses noGravado for non-taxable charges
    const cuerpoDocumento: CuerpoDocumentoExportacion[] = input.items.map((item, index) => {
      const subtotal = this.roundTo2Decimals(item.cantidad * item.precioUnitario);
      return {
        numItem: index + 1,
        cantidad: item.cantidad,
        codigo: item.codigo || null,
        uniMedida: item.uniMedida || 59,
        descripcion: item.descripcion,
        precioUni: item.precioUnitario,
        montoDescu: item.descuento || 0,
        ventaGravada: subtotal - (item.descuento || 0),
        tributos: item.tributos || null,
        noGravado: item.noGravado || 0,
      };
    });

    const totalGravada = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.ventaGravada, 0));
    const totalNoGravado = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.noGravado, 0));
    const totalDescu = this.roundTo2Decimals(cuerpoDocumento.reduce((sum, item) => sum + item.montoDescu, 0));
    const montoTotalOperacion = this.roundTo2Decimals(totalGravada + totalNoGravado + (input.flete || 0) + (input.seguro || 0));
    const totalPagar = montoTotalOperacion;

    const condicionOperacion = input.condicionOperacion || 1;
    const pagos: Pago[] | null = condicionOperacion !== 2 ? [{
      codigo: '01',
      montoPago: totalPagar,
      referencia: null,
      plazo: null,
      periodo: null,
    }] : null;

    const resumen: ResumenExportacion = {
      totalGravada,
      descuento: totalDescu,
      porcentajeDescuento: totalGravada > 0 ? this.roundTo2Decimals((totalDescu / (totalGravada + totalDescu)) * 100) : 0,
      totalDescu,
      seguro: input.seguro || null,
      flete: input.flete || null,
      montoTotalOperacion,
      totalNoGravado,
      totalPagar,
      totalLetras: this.numberToWords(totalPagar),
      condicionOperacion,
      pagos,
      codIncoterms: input.codIncoterms || null,
      descIncoterms: input.descIncoterms || null,
      numPagoElectronico: null,
      observaciones: input.observaciones || null,
    };

    return {
      identificacion,
      emisor: input.emisor,
      receptor: input.receptor || null,
      otrosDocumentos: input.otrosDocumentos || null,
      ventaTercero: null,
      cuerpoDocumento,
      resumen,
      apendice: null,
    };
  }
}

// === Input interfaces for new builders ===

export interface BuildNotaRemisionInput {
  emisor: Emisor;
  receptor: ReceptorNotaRemision;
  documentoRelacionado?: DocumentoRelacionado[];
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
    numeroDocumento?: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
}

export interface BuildDocumentoLiquidacionInput {
  emisor: EmisorLiquidacion;
  receptor: ReceptorLiquidacion;
  periodoInicio: string;
  periodoFin: string;
  valorOperaciones: number;
  comision?: number;
  porcentComision?: string;
  montoSinPercepcion?: number;
  descripSinPercepcion?: string;
  codLiquidacion?: string;
  cantidadDoc?: number;
  observaciones?: string;
  extension: ExtensionLiquidacion;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
}

export interface BuildFacturaExportacionInput {
  emisor: EmisorExportacion;
  receptor?: ReceptorExportacion;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigo?: string;
    uniMedida?: number;
    descuento?: number;
    tributos?: string[];
    noGravado?: number;
  }>;
  otrosDocumentos?: OtroDocumentoExportacion[];
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
  condicionOperacion?: CondicionOperacion;
  flete?: number;
  seguro?: number;
  codIncoterms?: string;
  descIncoterms?: string;
  observaciones?: string;
}

export interface BuildCRSInput {
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  documentoRelacionado?: DocumentoRelacionado[];
  retenciones: Array<{
    tipoImpuesto: TipoImpuestoRetencion;
    descripcion: string;
    tasa: number;
    montoSujetoRetencion: number;
    montoRetencion: number;
  }>;
  montoTotalRetencion: number;
  codEstablecimiento: string;
  correlativo: number;
  ambiente?: Ambiente;
}
