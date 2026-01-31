import { Injectable, Logger } from '@nestjs/common';
import { DteTypeCode, DTE_TYPES } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

export interface EmisorData {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  tipoEstablecimiento: string;
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  };
  telefono: string;
  correo: string;
  codEstableMH: string | null;
  codEstable: string | null;
  codPuntoVentaMH: string | null;
  codPuntoVenta: string | null;
}

export interface ReceptorData {
  tipoDocumento: string;
  numDocumento: string | null;
  nrc: string | null;
  nombre: string;
  codActividad: string | null;
  descActividad: string | null;
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  } | null;
  telefono: string | null;
  correo: string;
}

export interface ItemData {
  numItem: number;
  tipoItem: number;
  numeroDocumento: string | null;
  cantidad: number;
  codigo: string | null;
  codTributo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
  psv: number;
  noGravado: number;
  ivaItem?: number;
}

export interface GeneratedTestData {
  identificacion: {
    version: number;
    ambiente: string;
    tipoDte: string;
    numeroControl: string;
    codigoGeneracion: string;
    tipoModelo: number;
    tipoOperacion: number;
    tipoContingencia: number | null;
    motivoContin: string | null;
    fecEmi: string;
    horEmi: string;
    tipoMoneda: string;
  };
  documentoRelacionado: null;
  emisor: EmisorData;
  receptor: ReceptorData;
  otrosDocumentos: null;
  ventaTercero: null;
  cuerpoDocumento: ItemData[];
  resumen: {
    totalNoSuj: number;
    totalExenta: number;
    totalGravada: number;
    subTotalVentas: number;
    descuNoSuj: number;
    descuExenta: number;
    descuGravada: number;
    porcentajeDescuento: number;
    totalDescu: number;
    tributos: Array<{
      codigo: string;
      descripcion: string;
      valor: number;
    }> | null;
    subTotal: number;
    ivaRete1: number;
    reteRenta: number;
    montoTotalOperacion: number;
    totalNoGravado: number;
    totalPagar: number;
    totalLetras: string;
    totalIva?: number;
    saldoFavor?: number;
    condicionOperacion: number;
    pagos: Array<{
      codigo: string;
      montoPago: number;
      referencia: string | null;
      plazo: string | null;
      periodo: number | null;
    }> | null;
    numPagoElectronico: string | null;
  };
  extension: {
    nombEntrega: string | null;
    docuEntrega: string | null;
    nombRecibe: string | null;
    docuRecibe: string | null;
    observaciones: string | null;
    placaVehiculo: string | null;
  } | null;
  apendice: null;
}

/**
 * Service for generating test data for Hacienda DTE tests
 */
@Injectable()
export class TestDataGeneratorService {
  private readonly logger = new Logger(TestDataGeneratorService.name);

  // Sample product catalog for test items
  private readonly sampleProducts = [
    { descripcion: 'Servicio de consultoría técnica', precio: 100.00 },
    { descripcion: 'Licencia de software mensual', precio: 50.00 },
    { descripcion: 'Soporte técnico especializado', precio: 75.00 },
    { descripcion: 'Desarrollo de módulo personalizado', precio: 250.00 },
    { descripcion: 'Capacitación técnica', precio: 150.00 },
    { descripcion: 'Mantenimiento preventivo', precio: 80.00 },
    { descripcion: 'Análisis de sistemas', precio: 120.00 },
    { descripcion: 'Implementación de soluciones', precio: 200.00 },
  ];

  // DTE version by type
  private readonly DTE_VERSIONS: Record<string, number> = {
    '01': 1, // Factura
    '03': 3, // CCF
    '04': 3, // Nota de Remisión
    '05': 3, // Nota de Crédito
    '06': 3, // Nota de Débito
    '11': 1, // Factura de Exportación
    '14': 1, // Factura de Sujeto Excluido
  };

  /**
   * Generate test data for a specific DTE type
   */
  generateTestData(
    dteType: DteTypeCode,
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];

    // Generate unique codes
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl(dteType, correlativo);

    // Generate items
    const items = this.generateItems(dteType);

    // Calculate totals
    const totals = this.calculateTotals(items, dteType);

    // Generate receptor based on DTE type
    const receptor = this.generateReceptor(dteType);

    const testData: GeneratedTestData = {
      identificacion: {
        version: this.DTE_VERSIONS[dteType] || 1,
        ambiente: '00', // Test environment
        tipoDte: dteType,
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1, // Previo
        tipoOperacion: 1, // Normal
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: null,
      emisor: this.formatEmisor(emisor),
      receptor,
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: totals.totalNoSuj,
        totalExenta: totals.totalExenta,
        totalGravada: totals.totalGravada,
        subTotalVentas: totals.subTotalVentas,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: totals.tributos,
        subTotal: totals.subTotal,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totals.montoTotalOperacion,
        totalNoGravado: 0,
        totalPagar: totals.totalPagar,
        totalLetras: this.numberToWords(totals.totalPagar),
        totalIva: totals.totalIva,
        saldoFavor: 0,
        condicionOperacion: 1, // Contado
        pagos: [
          {
            codigo: '01', // Efectivo
            montoPago: totals.totalPagar,
            referencia: null,
            plazo: null,
            periodo: null,
          },
        ],
        numPagoElectronico: null,
      },
      extension: null,
      apendice: null,
    };

    this.logger.debug(
      `Generated test data for ${DTE_TYPES[dteType]}: ${codigoGeneracion}`,
    );

    return testData;
  }

  /**
   * Generate cancellation test data
   */
  generateCancellationData(
    originalDte: {
      codigoGeneracion: string;
      selloRecibido: string;
      tipoDte: string;
      numeroControl: string;
      fecEmi: string;
    },
    emisor: EmisorData,
  ): Record<string, unknown> {
    const now = new Date();
    const fecAnula = now.toISOString().split('T')[0];
    const horAnula = now.toTimeString().split(' ')[0];

    // Format NIT and NRC without dashes
    const nitFormatted = emisor.nit.replace(/-/g, '');
    const nrcFormatted = emisor.nrc.replace(/-/g, '');
    const telefonoFormatted = emisor.telefono.replace(/-/g, '');

    return {
      identificacion: {
        version: 2,
        ambiente: '00', // Test environment
        codigoGeneracion: uuidv4().toUpperCase(),
        fecAnula,
        horAnula,
      },
      emisor: {
        nit: nitFormatted,
        nombre: emisor.nombre,
        tipoEstablecimiento: emisor.tipoEstablecimiento,
        nomEstablecimiento: emisor.nombreComercial || emisor.nombre,
        codEstableMH: emisor.codEstableMH || null,
        codEstable: emisor.codEstable || null,
        codPuntoVentaMH: emisor.codPuntoVentaMH || null,
        codPuntoVenta: emisor.codPuntoVenta || null,
        telefono: telefonoFormatted,
        correo: emisor.correo,
      },
      documento: {
        tipoDte: originalDte.tipoDte,
        codigoGeneracion: originalDte.codigoGeneracion,
        selloRecibido: originalDte.selloRecibido,
        numeroControl: originalDte.numeroControl,
        fecEmi: originalDte.fecEmi,
        montoIva: 0,
        codigoGeneracionR: null,
        tipoDocumento: null,
        numDocumento: null,
        nombre: null,
        telefono: null,
        correo: null,
      },
      motivo: {
        tipoAnulacion: '2', // String "2" = Rescindir operación
        motivoAnulacion: 'Prueba de anulación para proceso de acreditación',
        nombreResponsable: 'Responsable de Pruebas',
        tipDocResponsable: '36', // NIT
        numDocResponsable: nitFormatted,
        nombreSolicita: 'Solicitante de Pruebas',
        tipDocSolicita: '36',
        numDocSolicita: nitFormatted,
      },
    };
  }

  /**
   * Generate numero de control
   * Format: DTE-XX-M001P001-000000000000001 (max 31 chars)
   */
  private generateNumeroControl(dteType: string, correlativo: number): string {
    const prefix = 'DTE';
    const tipoDoc = dteType;
    const codEstablePuntoVenta = 'M001P001'; // 8 chars: establecimiento + punto de venta
    const correlativoStr = correlativo.toString().padStart(15, '0');
    return `${prefix}-${tipoDoc}-${codEstablePuntoVenta}-${correlativoStr}`;
  }

  /**
   * Generate test items
   */
  private generateItems(dteType: DteTypeCode): ItemData[] {
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const items: ItemData[] = [];

    for (let i = 0; i < numItems; i++) {
      const product = this.sampleProducts[Math.floor(Math.random() * this.sampleProducts.length)];
      const cantidad = Math.floor(Math.random() * 3) + 1;
      const precioUni = product.precio;

      // ventaGravada is the sale amount (price * quantity)
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));
      let ivaItem: number | undefined;

      if (dteType === '01') {
        // For Factura (01), IVA is calculated as 13% of ventaGravada
        // Using precise calculation: ventaGravada / 1.13 * 0.13
        // This gives the IVA portion when price includes IVA
        ivaItem = Number((ventaGravada / 1.13 * 0.13).toFixed(2));
      }

      items.push({
        numItem: i + 1,
        tipoItem: 2, // Servicio
        numeroDocumento: null,
        cantidad,
        codigo: `PROD-${(i + 1).toString().padStart(4, '0')}`,
        codTributo: null,
        uniMedida: 99, // Otros
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: dteType === '03' ? ['20'] : null, // IVA for CCF
        psv: 0,
        noGravado: 0,
        ivaItem,
      });
    }

    return items;
  }

  /**
   * Calculate totals based on items and DTE type
   */
  private calculateTotals(
    items: ItemData[],
    dteType: DteTypeCode,
  ): {
    totalNoSuj: number;
    totalExenta: number;
    totalGravada: number;
    subTotalVentas: number;
    subTotal: number;
    totalIva: number;
    montoTotalOperacion: number;
    totalPagar: number;
    tributos: Array<{ codigo: string; descripcion: string; valor: number }> | null;
  } {
    const totalGravada = items.reduce((sum, item) => sum + item.ventaGravada, 0);
    let totalIva = 0;
    let tributos: Array<{ codigo: string; descripcion: string; valor: number }> | null = null;

    if (dteType === '03') {
      // For CCF, IVA is calculated and shown in tributos
      totalIva = Number((totalGravada * 0.13).toFixed(2));
      tributos = [
        {
          codigo: '20',
          descripcion: 'Impuesto al Valor Agregado 13%',
          valor: totalIva,
        },
      ];
    } else if (dteType === '01') {
      // For Factura, IVA is included in the price
      totalIva = items.reduce((sum, item) => sum + (item.ivaItem || 0), 0);
    }

    const subTotalVentas = totalGravada;
    const subTotal = totalGravada + (dteType === '03' ? totalIva : 0);
    const montoTotalOperacion = subTotal;
    const totalPagar = montoTotalOperacion;

    return {
      totalNoSuj: 0,
      totalExenta: 0,
      totalGravada: Number(totalGravada.toFixed(2)),
      subTotalVentas: Number(subTotalVentas.toFixed(2)),
      subTotal: Number(subTotal.toFixed(2)),
      totalIva: Number(totalIva.toFixed(2)),
      montoTotalOperacion: Number(montoTotalOperacion.toFixed(2)),
      totalPagar: Number(totalPagar.toFixed(2)),
      tributos,
    };
  }

  /**
   * Generate receptor based on DTE type
   */
  private generateReceptor(dteType: DteTypeCode): ReceptorData {
    const testReceivers: Record<string, ReceptorData> = {
      // For Factura (01) - Consumer final with DUI
      '01': {
        tipoDocumento: '13', // DUI (not 36)
        numDocumento: '01234567-8', // Valid DUI format: 8 digits + dash + 1 digit
        nrc: null,
        nombre: 'CONSUMIDOR FINAL PRUEBA',
        codActividad: null,
        descActividad: null,
        direccion: {
          departamento: '06', // San Salvador
          municipio: '14', // San Salvador
          complemento: 'Dirección de prueba, Col. Test #123',
        },
        telefono: '22222222',
        correo: 'test@example.com',
      },
      // For CCF (03) - Business with NIT/NRC
      '03': {
        tipoDocumento: '36', // NIT
        numDocumento: '06140101001000', // 14 digits without dashes
        nrc: '123456',
        nombre: 'EMPRESA DE PRUEBA, S.A. DE C.V.',
        codActividad: '62010',
        descActividad: 'Programación informática',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Colonia Escalón, Calle La Mascota #123',
        },
        telefono: '25555555',
        correo: 'empresa.prueba@example.com',
      },
      // For Nota de Remisión (04)
      '04': {
        tipoDocumento: '36',
        numDocumento: '06140101001000', // 14 digits without dashes
        nrc: '123456',
        nombre: 'EMPRESA RECEPTORA PRUEBA, S.A. DE C.V.',
        codActividad: '46100',
        descActividad: 'Comercio al por mayor',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Zona Industrial, Blvd. del Ejército Km 5',
        },
        telefono: '23333333',
        correo: 'receptora@example.com',
      },
      // For Sujeto Excluido (14)
      '14': {
        tipoDocumento: '13', // DUI
        numDocumento: '01234567-8', // Valid DUI format
        nrc: null,
        nombre: 'PERSONA NATURAL SUJETO EXCLUIDO',
        codActividad: null,
        descActividad: null,
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Dirección de persona natural',
        },
        telefono: '77777777',
        correo: 'excluido@example.com',
      },
    };

    // Default to factura receptor for types not specifically defined
    return testReceivers[dteType] || testReceivers['01'];
  }

  /**
   * Format emisor data - remove dashes from NIT and NRC
   * Hacienda requires both without dashes
   */
  private formatEmisor(emisor: EmisorData): EmisorData {
    const formatted = {
      ...emisor,
      nit: emisor.nit.replace(/-/g, ''), // Remove dashes from NIT
      nrc: emisor.nrc.replace(/-/g, ''), // Remove dashes from NRC
    };
    this.logger.log(`=== FORMATTED EMISOR FOR DTE ===`);
    this.logger.log(`Original NIT: ${emisor.nit} -> Formatted: ${formatted.nit}`);
    this.logger.log(`Original NRC: ${emisor.nrc} -> Formatted: ${formatted.nrc}`);
    return formatted;
  }

  /**
   * Convert number to words (Spanish)
   */
  private numberToWords(amount: number): string {
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    // Simplified conversion for test purposes
    if (dollars === 0) {
      return `CERO ${cents.toString().padStart(2, '0')}/100 DOLARES`;
    }

    const words = this.convertToWords(dollars);
    return `${words} ${cents.toString().padStart(2, '0')}/100 DOLARES`;
  }

  private convertToWords(num: number): string {
    const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const hundreds = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (unit === 0) return tens[ten];
      if (ten === 2) return `VEINTI${units[unit]}`;
      return `${tens[ten]} Y ${units[unit]}`;
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      if (rest === 0) return hundred === 1 ? 'CIEN' : hundreds[hundred];
      return `${hundred === 1 ? 'CIENTO' : hundreds[hundred]} ${this.convertToWords(rest)}`;
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const rest = num % 1000;
      const thousandWord = thousands === 1 ? 'MIL' : `${this.convertToWords(thousands)} MIL`;
      if (rest === 0) return thousandWord;
      return `${thousandWord} ${this.convertToWords(rest)}`;
    }

    return num.toString(); // Fallback for very large numbers
  }
}
