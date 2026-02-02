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
  tipoDocumento: string | null;
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
  correo: string | null;
}

export interface ItemData {
  numItem: number;
  tipoItem?: number;
  numeroDocumento?: string | null;
  cantidad: number;
  codigo: string | null;
  codTributo?: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj?: number;
  ventaExenta?: number;
  ventaGravada?: number;
  tributos?: string[] | null;
  psv?: number;
  noGravado?: number;
  ivaItem?: number;
  // Export invoice fields
  tipoItemExpor?: number;
  descu?: number;
  compra?: number;
}

export interface GeneratedTestData {
  identificacion: Record<string, unknown>;
  documentoRelacionado?: unknown;
  emisor: Record<string, unknown>;
  receptor?: Record<string, unknown>;
  sujetoExcluido?: Record<string, unknown>;
  otrosDocumentos?: unknown;
  ventaTercero?: unknown;
  cuerpoDocumento: Record<string, unknown>[];
  resumen: Record<string, unknown>;
  extension?: unknown;
  apendice?: unknown;
}

/**
 * Service for generating test data for Hacienda DTE tests
 * Supports all DTE types with their specific schemas
 */
@Injectable()
export class TestDataGeneratorService {
  private readonly logger = new Logger(TestDataGeneratorService.name);

  // Sample product catalog for test items
  private readonly sampleProducts = [
    { descripcion: 'Servicio de consultoría técnica', precio: 100.0 },
    { descripcion: 'Licencia de software mensual', precio: 50.0 },
    { descripcion: 'Soporte técnico especializado', precio: 75.0 },
    { descripcion: 'Desarrollo de módulo personalizado', precio: 250.0 },
    { descripcion: 'Capacitación técnica', precio: 150.0 },
    { descripcion: 'Mantenimiento preventivo', precio: 80.0 },
    { descripcion: 'Análisis de sistemas', precio: 120.0 },
    { descripcion: 'Implementación de soluciones', precio: 200.0 },
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
   * Routes to specific generators based on DTE type
   */
  generateTestData(
    dteType: DteTypeCode,
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    this.logger.log(`Generating test data for DTE type: ${dteType}`);

    switch (dteType) {
      case '01':
        return this.generateFactura(emisor, correlativo);
      case '03':
        return this.generateCCF(emisor, correlativo);
      case '04':
        return this.generateNotaRemision(emisor, correlativo);
      case '05':
        return this.generateNotaCredito(emisor, correlativo);
      case '06':
        return this.generateNotaDebito(emisor, correlativo);
      case '11':
        return this.generateFacturaExportacion(emisor, correlativo);
      case '14':
        return this.generateFacturaSujetoExcluido(emisor, correlativo);
      default:
        // Default to Factura format
        return this.generateFactura(emisor, correlativo);
    }
  }

  /**
   * Generate Factura (01) - Consumer Invoice
   */
  private generateFactura(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('01', correlativo);

    const items = this.generateItemsFactura();
    const totals = this.calculateTotalsFactura(items);
    const formattedEmisor = this.formatEmisor(emisor);

    return {
      identificacion: {
        version: 1,
        ambiente: '00',
        tipoDte: '01',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: null,
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
        codEstableMH: formattedEmisor.codEstableMH,
        codEstable: formattedEmisor.codEstable,
        codPuntoVentaMH: formattedEmisor.codPuntoVentaMH,
        codPuntoVenta: formattedEmisor.codPuntoVenta,
      },
      receptor: {
        tipoDocumento: '13', // DUI
        numDocumento: '012345678',
        nrc: null,
        nombre: 'CONSUMIDOR FINAL PRUEBA',
        codActividad: null,
        descActividad: null,
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Dirección de prueba, Col. Test #123',
        },
        telefono: '22222222',
        correo: 'test@example.com',
      },
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: totals.totalGravada,
        subTotalVentas: totals.subTotalVentas,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: null,
        subTotal: totals.subTotal,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totals.montoTotalOperacion,
        totalNoGravado: 0,
        totalPagar: totals.totalPagar,
        totalLetras: this.numberToWords(totals.totalPagar),
        totalIva: totals.totalIva,
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: [
          {
            codigo: '01',
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
  }

  /**
   * Generate CCF (03) - Comprobante de Crédito Fiscal
   */
  private generateCCF(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('03', correlativo);

    const items = this.generateItemsCCF();
    const totals = this.calculateTotalsCCF(items);
    const formattedEmisor = this.formatEmisor(emisor);

    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: '03',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: null,
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
        codEstableMH: formattedEmisor.codEstableMH,
        codEstable: formattedEmisor.codEstable,
        codPuntoVentaMH: formattedEmisor.codPuntoVentaMH,
        codPuntoVenta: formattedEmisor.codPuntoVenta,
      },
      receptor: {
        nit: '06140101001000',
        nrc: '1234567',
        nombre: 'EMPRESA DE PRUEBA, S.A. DE C.V.',
        codActividad: '62010',
        descActividad: 'Programación informática',
        nombreComercial: 'Empresa Prueba',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Colonia Escalón, Calle La Mascota #123',
        },
        telefono: '25555555',
        correo: 'empresa.prueba@example.com',
      },
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: totals.totalGravada,
        subTotalVentas: totals.subTotalVentas,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: [
          {
            codigo: '20',
            descripcion: 'Impuesto al Valor Agregado 13%',
            valor: totals.totalIva,
          },
        ],
        subTotal: totals.subTotal,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totals.montoTotalOperacion,
        totalNoGravado: 0,
        totalPagar: totals.totalPagar,
        totalLetras: this.numberToWords(totals.totalPagar),
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: [
          {
            codigo: '01',
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
  }

  /**
   * Generate Nota de Remisión (04) - Delivery Note
   */
  private generateNotaRemision(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('04', correlativo);
    const formattedEmisor = this.formatEmisor(emisor);

    const items = this.generateItemsNotaRemision();
    const totalGravada = items.reduce(
      (sum, item) => sum + (item.ventaGravada as number),
      0,
    );
    const totalIva = Number((totalGravada * 0.13).toFixed(2));
    const subTotal = Number((totalGravada + totalIva).toFixed(2));

    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: '04',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: null,
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
        codEstableMH: formattedEmisor.codEstableMH,
        codEstable: formattedEmisor.codEstable,
        codPuntoVentaMH: formattedEmisor.codPuntoVentaMH,
        codPuntoVenta: formattedEmisor.codPuntoVenta,
      },
      receptor: {
        tipoDocumento: '36', // NIT
        numDocumento: '06140101001000',
        nrc: '1234567',
        nombre: 'EMPRESA RECEPTORA PRUEBA, S.A. DE C.V.',
        codActividad: '46100',
        descActividad: 'Comercio al por mayor',
        nombreComercial: 'Empresa Receptora',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Zona Industrial, Blvd. del Ejército Km 5',
        },
        telefono: '23333333',
        correo: 'receptora@example.com',
        bienTitulo: '04', // Remitir a cuenta de terceros
      },
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada,
        subTotalVentas: totalGravada,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: [
          {
            codigo: '20',
            descripcion: 'Impuesto al Valor Agregado 13%',
            valor: totalIva,
          },
        ],
        subTotal,
        montoTotalOperacion: subTotal,
        totalLetras: this.numberToWords(subTotal),
      },
      extension: null,
      apendice: null,
    };
  }

  /**
   * Generate Nota de Crédito (05) - Credit Note
   * Requires a related document
   */
  private generateNotaCredito(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('05', correlativo);
    const formattedEmisor = this.formatEmisor(emisor);

    // Generate the related document UUID first so we can use it in items
    const relatedDocUUID = uuidv4().toUpperCase();
    const items = this.generateItemsNotaCreditoDebito(relatedDocUUID);
    const totals = this.calculateTotalsCCF(items);

    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: '05',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: [
        {
          tipoDocumento: '03', // Related to a CCF
          tipoGeneracion: 1, // Electrónico
          numeroDocumento: relatedDocUUID,
          fechaEmision: fecEmi,
        },
      ],
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
      },
      receptor: {
        nit: '06140101001000',
        nrc: '1234567',
        nombre: 'EMPRESA DE PRUEBA, S.A. DE C.V.',
        codActividad: '62010',
        descActividad: 'Programación informática',
        nombreComercial: 'Empresa Prueba',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Colonia Escalón, Calle La Mascota #123',
        },
        telefono: '25555555',
        correo: 'empresa.prueba@example.com',
      },
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: totals.totalGravada,
        subTotalVentas: totals.subTotalVentas,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        totalDescu: 0,
        tributos: [
          {
            codigo: '20',
            descripcion: 'Impuesto al Valor Agregado 13%',
            valor: totals.totalIva,
          },
        ],
        subTotal: totals.subTotal,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totals.montoTotalOperacion,
        totalLetras: this.numberToWords(totals.montoTotalOperacion),
        condicionOperacion: 1,
      },
      extension: null,
      apendice: null,
    };
  }

  /**
   * Generate Nota de Débito (06) - Debit Note
   * Requires a related document
   * No codEstable fields in emisor, no porcentajeDescuento in resumen
   */
  private generateNotaDebito(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('06', correlativo);
    const formattedEmisor = this.formatEmisor(emisor);

    // Generate the related document UUID first so we can use it in items
    const relatedDocUUID = uuidv4().toUpperCase();
    const items = this.generateItemsNotaCreditoDebito(relatedDocUUID);
    const totals = this.calculateTotalsCCF(items);

    return {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: '06',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      documentoRelacionado: [
        {
          tipoDocumento: '03', // Related to a CCF
          tipoGeneracion: 1, // Electrónico
          numeroDocumento: relatedDocUUID,
          fechaEmision: fecEmi,
        },
      ],
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
      },
      receptor: {
        nit: '06140101001000',
        nrc: '1234567',
        nombre: 'EMPRESA DE PRUEBA, S.A. DE C.V.',
        codActividad: '62010',
        descActividad: 'Programación informática',
        nombreComercial: 'Empresa Prueba',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Colonia Escalón, Calle La Mascota #123',
        },
        telefono: '25555555',
        correo: 'empresa.prueba@example.com',
      },
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: totals.totalGravada,
        subTotalVentas: totals.subTotalVentas,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        totalDescu: 0,
        tributos: [
          {
            codigo: '20',
            descripcion: 'Impuesto al Valor Agregado 13%',
            valor: totals.totalIva,
          },
        ],
        subTotal: totals.subTotal,
        ivaPerci1: 0,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totals.montoTotalOperacion,
        totalLetras: this.numberToWords(totals.montoTotalOperacion),
        numPagoElectronico: null,
        condicionOperacion: 1,
      },
      extension: null,
      apendice: null,
    };
  }

  /**
   * Generate Factura de Exportación (11) - Export Invoice
   * Has completely different schema from domestic invoices
   */
  private generateFacturaExportacion(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('11', correlativo);
    const formattedEmisor = this.formatEmisor(emisor);

    const items = this.generateItemsExportacion();
    const totalGravada = items.reduce(
      (sum, item) => sum + (item.ventaGravada as number),
      0,
    );

    return {
      identificacion: {
        version: 1,
        ambiente: '00',
        tipoDte: '11',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContigencia: null, // Note: Hacienda uses "Contigencia" (typo)
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        nombreComercial: formattedEmisor.nombreComercial,
        tipoEstablecimiento: formattedEmisor.tipoEstablecimiento,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
        codEstableMH: formattedEmisor.codEstableMH,
        codEstable: formattedEmisor.codEstable,
        codPuntoVentaMH: formattedEmisor.codPuntoVentaMH,
        codPuntoVenta: formattedEmisor.codPuntoVenta,
        // Export specific fields
        tipoItemExpor: 1, // 1=Bienes, 2=Servicios
        recintoFiscal: '01', // Recinto fiscal
        regimen: '01', // Régimen de exportación
      },
      receptor: {
        tipoDocumento: '37', // Otro (for foreign entities)
        numDocumento: 'EXT-123456789',
        nombre: 'EMPRESA EXTRANJERA DE PRUEBA LLC',
        nombreComercial: 'Foreign Test Company',
        tipoPersona: 1, // 1=Natural, 2=Jurídica
        descActividad: 'Importación de servicios tecnológicos',
        codPais: 'US', // United States
        nombrePais: 'ESTADOS UNIDOS',
        complemento: '123 Main Street, Miami, FL 33101',
        telefono: '+1-305-555-0123',
        correo: 'imports@foreigncompany.com',
      },
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: items,
      resumen: {
        totalGravada,
        porcentajeDescuento: 0,
        totalDescu: 0,
        descuento: 0,
        montoTotalOperacion: totalGravada,
        totalNoGravado: 0,
        totalPagar: totalGravada,
        totalLetras: this.numberToWords(totalGravada),
        condicionOperacion: 1,
        pagos: [
          {
            codigo: '05', // Transferencia - Depósito Bancario
            montoPago: totalGravada,
            referencia: 'WIRE-' + Date.now(),
            plazo: null,
            periodo: null,
          },
        ],
        numPagoElectronico: null,
        // Export specific fields
        codIncoterms: 'FOB', // Free On Board
        descIncoterms: 'Free On Board',
        flete: 0,
        seguro: 0,
        observaciones: 'Exportación de servicios tecnológicos',
      },
      apendice: null,
    };
  }

  /**
   * Generate Factura de Sujeto Excluido (14) - Excluded Subject Invoice
   * For transactions with subjects excluded from IVA
   */
  private generateFacturaSujetoExcluido(
    emisor: EmisorData,
    correlativo: number,
  ): GeneratedTestData {
    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];
    const codigoGeneracion = uuidv4().toUpperCase();
    const numeroControl = this.generateNumeroControl('14', correlativo);
    const formattedEmisor = this.formatEmisor(emisor);

    const items = this.generateItemsSujetoExcluido();
    const totalCompra = items.reduce(
      (sum, item) => sum + (item.compra as number),
      0,
    );

    return {
      identificacion: {
        version: 1,
        ambiente: '00',
        tipoDte: '14',
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: formattedEmisor.nit,
        nrc: formattedEmisor.nrc,
        nombre: formattedEmisor.nombre,
        codActividad: formattedEmisor.codActividad,
        descActividad: formattedEmisor.descActividad,
        direccion: formattedEmisor.direccion,
        telefono: formattedEmisor.telefono,
        correo: formattedEmisor.correo,
        codEstableMH: formattedEmisor.codEstableMH,
        codEstable: formattedEmisor.codEstable,
        codPuntoVentaMH: formattedEmisor.codPuntoVentaMH,
        codPuntoVenta: formattedEmisor.codPuntoVenta,
      },
      sujetoExcluido: {
        tipoDocumento: '13', // DUI
        numDocumento: '012345678',
        nombre: 'PERSONA NATURAL SUJETO EXCLUIDO',
        codActividad: '01610', // Actividades de apoyo a la agricultura
        descActividad: 'Actividades de apoyo a la agricultura',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Cantón San José, Km 25 Carretera Panamericana',
        },
        telefono: '77777777',
        correo: 'agricultor@example.com',
      },
      cuerpoDocumento: items,
      resumen: {
        totalCompra,
        descu: 0,
        totalDescu: 0,
        subTotal: totalCompra,
        ivaRete1: 0,
        reteRenta: 0,
        totalPagar: totalCompra,
        totalLetras: this.numberToWords(totalCompra),
        condicionOperacion: 1,
        pagos: [
          {
            codigo: '01', // Efectivo
            montoPago: totalCompra,
            referencia: null,
            plazo: null,
            periodo: null,
          },
        ],
        observaciones: 'Compra a sujeto excluido del IVA',
      },
      apendice: null,
    };
  }

  // ==================== Item Generators ====================

  private generateItemsFactura(): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    for (let i = 0; i < numItems; i++) {
      const product =
        this.sampleProducts[
          Math.floor(Math.random() * this.sampleProducts.length)
        ];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const precioUni = product.precio;
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));
      const ivaItem = Number(((ventaGravada / 1.13) * 0.13).toFixed(2));

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
        tributos: null,
        psv: 0,
        noGravado: 0,
        ivaItem,
      });
    }

    return items;
  }

  private generateItemsCCF(): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    for (let i = 0; i < numItems; i++) {
      const product =
        this.sampleProducts[
          Math.floor(Math.random() * this.sampleProducts.length)
        ];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const precioUni = product.precio;
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));

      items.push({
        numItem: i + 1,
        tipoItem: 2,
        numeroDocumento: null,
        cantidad,
        codigo: `PROD-${(i + 1).toString().padStart(4, '0')}`,
        codTributo: null,
        uniMedida: 99,
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: ['20'], // IVA
        psv: 0,
        noGravado: 0,
      });
    }

    return items;
  }

  private generateItemsNotaRemision(): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    for (let i = 0; i < numItems; i++) {
      const product =
        this.sampleProducts[
          Math.floor(Math.random() * this.sampleProducts.length)
        ];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const precioUni = product.precio;
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));

      items.push({
        numItem: i + 1,
        tipoItem: 2,
        numeroDocumento: null,
        cantidad,
        codigo: `PROD-${(i + 1).toString().padStart(4, '0')}`,
        codTributo: null,
        uniMedida: 99,
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: ['20'],
      });
    }

    return items;
  }

  /**
   * Generate items for Nota de Crédito (05) and Nota de Débito (06)
   * No noGravado, psv fields
   * numeroDocumento must be the UUID of the related document
   */
  private generateItemsNotaCreditoDebito(
    relatedDocUUID: string,
  ): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    for (let i = 0; i < numItems; i++) {
      const product =
        this.sampleProducts[
          Math.floor(Math.random() * this.sampleProducts.length)
        ];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const precioUni = product.precio;
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));

      items.push({
        numItem: i + 1,
        tipoItem: 2,
        numeroDocumento: relatedDocUUID,
        cantidad,
        codigo: `PROD-${(i + 1).toString().padStart(4, '0')}`,
        codTributo: null,
        uniMedida: 99,
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: ['20'], // IVA
      });
    }

    return items;
  }

  private generateItemsExportacion(): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    for (let i = 0; i < numItems; i++) {
      const product =
        this.sampleProducts[
          Math.floor(Math.random() * this.sampleProducts.length)
        ];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const precioUni = product.precio;
      const ventaGravada = Number((precioUni * cantidad).toFixed(2));

      items.push({
        numItem: i + 1,
        cantidad,
        codigo: `EXP-${(i + 1).toString().padStart(4, '0')}`,
        uniMedida: 99,
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        ventaGravada,
        noGravado: 0,
        tributos: null, // Required for export invoice
      });
    }

    return items;
  }

  private generateItemsSujetoExcluido(): Record<string, unknown>[] {
    const numItems = Math.floor(Math.random() * 2) + 1;
    const items: Record<string, unknown>[] = [];

    // Products for excluded subject (typically agricultural)
    const productos = [
      { descripcion: 'Maíz en grano', precio: 50.0 },
      { descripcion: 'Frijol rojo', precio: 75.0 },
      { descripcion: 'Arroz en granza', precio: 45.0 },
    ];

    for (let i = 0; i < numItems; i++) {
      const product = productos[Math.floor(Math.random() * productos.length)];
      const cantidad = Math.floor(Math.random() * 5) + 1;
      const precioUni = product.precio;
      const compra = Number((precioUni * cantidad).toFixed(2));

      items.push({
        numItem: i + 1,
        tipoItem: 1, // Bien
        cantidad,
        codigo: `AGR-${(i + 1).toString().padStart(4, '0')}`,
        uniMedida: 8, // Quintal
        descripcion: product.descripcion,
        precioUni,
        montoDescu: 0,
        compra,
      });
    }

    return items;
  }

  // ==================== Calculation Methods ====================

  private calculateTotalsFactura(items: Record<string, unknown>[]): {
    totalGravada: number;
    subTotalVentas: number;
    subTotal: number;
    totalIva: number;
    montoTotalOperacion: number;
    totalPagar: number;
  } {
    const totalGravada = items.reduce(
      (sum, item) => sum + (item.ventaGravada as number),
      0,
    );
    const totalIva = items.reduce(
      (sum, item) => sum + ((item.ivaItem as number) || 0),
      0,
    );

    return {
      totalGravada: Number(totalGravada.toFixed(2)),
      subTotalVentas: Number(totalGravada.toFixed(2)),
      subTotal: Number(totalGravada.toFixed(2)),
      totalIva: Number(totalIva.toFixed(2)),
      montoTotalOperacion: Number(totalGravada.toFixed(2)),
      totalPagar: Number(totalGravada.toFixed(2)),
    };
  }

  private calculateTotalsCCF(items: Record<string, unknown>[]): {
    totalGravada: number;
    subTotalVentas: number;
    subTotal: number;
    totalIva: number;
    montoTotalOperacion: number;
    totalPagar: number;
  } {
    const totalGravada = items.reduce(
      (sum, item) => sum + (item.ventaGravada as number),
      0,
    );
    const totalIva = Number((totalGravada * 0.13).toFixed(2));
    const subTotal = Number((totalGravada + totalIva).toFixed(2));

    return {
      totalGravada: Number(totalGravada.toFixed(2)),
      subTotalVentas: Number(totalGravada.toFixed(2)),
      subTotal,
      totalIva,
      montoTotalOperacion: subTotal,
      totalPagar: subTotal,
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Generate numero de control
   * Format: DTE-XX-M001P001-000000000000001 (max 31 chars)
   */
  private generateNumeroControl(dteType: string, correlativo: number): string {
    const prefix = 'DTE';
    const codEstablePuntoVenta = 'M001P001';
    const correlativoStr = correlativo.toString().padStart(15, '0');
    return `${prefix}-${dteType}-${codEstablePuntoVenta}-${correlativoStr}`;
  }

  /**
   * Format emisor data - remove dashes from NIT and NRC
   */
  private formatEmisor(emisor: EmisorData): EmisorData {
    const formatted = {
      ...emisor,
      nit: emisor.nit.replace(/-/g, ''),
      nrc: emisor.nrc.replace(/-/g, ''),
    };
    this.logger.log(`=== FORMATTED EMISOR FOR DTE ===`);
    this.logger.log(
      `Original NIT: ${emisor.nit} -> Formatted: ${formatted.nit}`,
    );
    this.logger.log(
      `Original NRC: ${emisor.nrc} -> Formatted: ${formatted.nrc}`,
    );
    return formatted;
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

    const nitFormatted = emisor.nit.replace(/-/g, '');
    const telefonoFormatted = emisor.telefono.replace(/-/g, '');

    // Determine receptor data based on original DTE type
    let tipoDocumento: string;
    let numDocumento: string;
    let nombre: string;

    switch (originalDte.tipoDte) {
      case '01': // Factura - consumer with DUI
        tipoDocumento = '13';
        numDocumento = '012345678';
        nombre = 'CONSUMIDOR FINAL PRUEBA';
        break;
      case '03': // CCF - business with NIT
      case '04': // Nota Remisión
      case '05': // Nota Crédito
      case '06': // Nota Débito
        tipoDocumento = '36';
        numDocumento = '06140101001000';
        nombre = 'EMPRESA DE PRUEBA, S.A. DE C.V.';
        break;
      case '11': // Exportación - foreign entity
        tipoDocumento = '37';
        numDocumento = 'EXT-123456789';
        nombre = 'EMPRESA EXTRANJERA DE PRUEBA LLC';
        break;
      case '14': // Sujeto Excluido
        tipoDocumento = '13';
        numDocumento = '012345678';
        nombre = 'PERSONA NATURAL SUJETO EXCLUIDO';
        break;
      default:
        tipoDocumento = '13';
        numDocumento = '012345678';
        nombre = 'CONSUMIDOR FINAL PRUEBA';
    }

    return {
      identificacion: {
        version: 2,
        ambiente: '00',
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
        tipoDocumento,
        numDocumento,
        nombre,
        telefono: '22222222',
        correo: 'test@example.com',
      },
      motivo: {
        tipoAnulacion: 2,
        motivoAnulacion: 'Prueba de anulación para proceso de acreditación',
        nombreResponsable: 'Responsable de Pruebas',
        tipDocResponsable: '36',
        numDocResponsable: nitFormatted,
        nombreSolicita: 'Solicitante de Pruebas',
        tipDocSolicita: '36',
        numDocSolicita: nitFormatted,
      },
    };
  }

  /**
   * Convert number to words (Spanish)
   */
  private numberToWords(amount: number): string {
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    if (dollars === 0) {
      return `CERO ${cents.toString().padStart(2, '0')}/100 DOLARES`;
    }

    const words = this.convertToWords(dollars);
    return `${words} ${cents.toString().padStart(2, '0')}/100 DOLARES`;
  }

  private convertToWords(num: number): string {
    const units = [
      '',
      'UNO',
      'DOS',
      'TRES',
      'CUATRO',
      'CINCO',
      'SEIS',
      'SIETE',
      'OCHO',
      'NUEVE',
    ];
    const teens = [
      'DIEZ',
      'ONCE',
      'DOCE',
      'TRECE',
      'CATORCE',
      'QUINCE',
      'DIECISEIS',
      'DIECISIETE',
      'DIECIOCHO',
      'DIECINUEVE',
    ];
    const tens = [
      '',
      '',
      'VEINTE',
      'TREINTA',
      'CUARENTA',
      'CINCUENTA',
      'SESENTA',
      'SETENTA',
      'OCHENTA',
      'NOVENTA',
    ];
    const hundreds = [
      '',
      'CIEN',
      'DOSCIENTOS',
      'TRESCIENTOS',
      'CUATROCIENTOS',
      'QUINIENTOS',
      'SEISCIENTOS',
      'SETECIENTOS',
      'OCHOCIENTOS',
      'NOVECIENTOS',
    ];

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
      const thousandWord =
        thousands === 1 ? 'MIL' : `${this.convertToWords(thousands)} MIL`;
      if (rest === 0) return thousandWord;
      return `${thousandWord} ${this.convertToWords(rest)}`;
    }

    return num.toString();
  }
}
