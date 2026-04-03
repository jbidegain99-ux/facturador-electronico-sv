import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/** Convert a number to its Spanish text representation for totalLetras */
function numberToWords(num: number): string {
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
  const convertThousands = (n: number): string => {
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      const rest = n % 1000;
      return (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + (rest ? ' ' + convertGroup(rest) : '');
    }
    return convertGroup(n);
  };
  let result = '';
  if (intPart === 0) result = 'CERO';
  else if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    const rest = intPart % 1000000;
    result = (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') + (rest ? ' ' + convertThousands(rest) : '');
  } else result = convertThousands(intPart);
  return `${result} ${decPart.toString().padStart(2, '0')}/100 USD`;
}

/** Common activity codes from MH catalog (CAT-019) */
const ACTIVIDAD_ECONOMICA_MAP: Record<string, string> = {
  '62010': 'Actividades de programación informática',
  '62020': 'Actividades de consultoría informática y gestión de instalaciones informáticas',
  '62090': 'Otras actividades de tecnología de la información y servicios informáticos',
  '46510': 'Venta al por mayor de computadoras, equipo periférico y programas informáticos',
  '47410': 'Venta al por menor de computadoras, equipo periférico, programas informáticos y equipo de telecomunicaciones en comercios especializados',
  '63110': 'Procesamiento de datos, hospedaje y actividades conexas',
  '70210': 'Actividades de consultoría de gestión',
  '73110': 'Publicidad',
  '69200': 'Actividades de contabilidad, teneduría de libros y auditoría; consultoría fiscal',
  '56101': 'Actividades de restaurantes y de servicio móvil de comidas',
  '47190': 'Otras actividades de venta al por menor en comercios no especializados',
  '41001': 'Construcción de edificios residenciales',
  '41002': 'Construcción de edificios no residenciales',
  '49110': 'Transporte interurbano de pasajeros por ferrocarril',
};

@Injectable()
export class DteNormalizationService {
  private readonly logger = new Logger(DteNormalizationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Normalize DTE JSON to comply with Hacienda's schema for the specific tipoDte.
   * Adds emisor from tenant data, fixes receptor format, and adjusts fields for CCF (03).
   */
  async normalizeJsonForHacienda(
    tenantId: string,
    tipoDte: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Load tenant with sucursal info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        sucursales: {
          where: { activa: true },
          orderBy: { esPrincipal: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant no encontrado');
    }

    const sucursal = tenant.sucursales[0];
    const identificacion = (data.identificacion as Record<string, unknown>) || {};
    const receptor = (data.receptor as Record<string, unknown>) || {};
    const cuerpoDocumento = (data.cuerpoDocumento as Array<Record<string, unknown>>) || [];
    const resumen = (data.resumen as Record<string, unknown>) || {};

    // Build emisor from tenant data (required for tipo 03, good practice for all)
    const emisor = this.buildEmisor(tenant, sucursal, data);

    if (tipoDte === '05' || tipoDte === '06') {
      return this.normalizeNotaCreditoDebito(tipoDte, identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '07') {
      return this.normalizeComprobanteRetencion(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '34') {
      return this.normalizeRetencionSimplificada(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '14') {
      return this.normalizeSujetoExcluido(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '04') {
      return this.normalizeNotaRemision(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '09') {
      return this.normalizeDocumentoContableLiquidacion(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '11') {
      return this.normalizeFacturaExportacion(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    if (tipoDte === '03') {
      return this.normalizeCreditoFiscal(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
    }

    // === Factura (01) - default ===
    return this.normalizeFactura(identificacion, receptor, cuerpoDocumento, resumen, emisor, data);
  }

  // =====================
  // Private helpers
  // =====================

  private buildEmisor(
    tenant: { nit: string; nrc: string; nombre: string; actividadEcon: string; nombreComercial: string | null; telefono: string; correo: string; direccion: string | null; sucursales: Array<{ tipoEstablecimiento: string | null; codEstableMH: string | null; codEstable: string | null }> },
    sucursal: { tipoEstablecimiento: string | null; codEstableMH: string | null; codEstable: string | null } | undefined,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    let direccionEmisor: Record<string, unknown>;
    try {
      direccionEmisor = typeof tenant.direccion === 'string' ? JSON.parse(tenant.direccion) : (tenant.direccion as unknown as Record<string, unknown>) ?? {};
    } catch {
      direccionEmisor = { departamento: '06', municipio: '14', complemento: tenant.direccion || '' };
    }
    if (typeof direccionEmisor === 'string' || !direccionEmisor?.departamento) {
      direccionEmisor = { departamento: '06', municipio: '14', complemento: String(direccionEmisor || tenant.direccion || '') };
    }

    return {
      nit: (tenant.nit || '').replace(/-/g, ''),
      nrc: (tenant.nrc || '').replace(/-/g, ''),
      nombre: tenant.nombre || '',
      codActividad: tenant.actividadEcon || '62010',
      descActividad: ACTIVIDAD_ECONOMICA_MAP[tenant.actividadEcon] || ((data.emisor as Record<string, unknown>)?.descActividad as string) || 'Servicios',
      nombreComercial: tenant.nombreComercial || null,
      tipoEstablecimiento: sucursal?.tipoEstablecimiento || '01',
      direccion: direccionEmisor,
      telefono: tenant.telefono || '00000000',
      correo: tenant.correo || '',
      codEstableMH: sucursal?.codEstableMH || null,
      codEstable: sucursal?.codEstable || null,
      codPuntoVentaMH: null,
      codPuntoVenta: null,
    };
  }

  private parseReceptorDireccion(direccion: unknown): Record<string, unknown> {
    let parsed = direccion;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = { departamento: '06', municipio: '14', complemento: parsed };
      }
    }
    if (!parsed || typeof parsed !== 'object' || !(parsed as Record<string, unknown>).departamento) {
      parsed = { departamento: '06', municipio: '14', complemento: String(parsed || '') };
    }
    return parsed as Record<string, unknown>;
  }

  private buildCcfReceptor(receptor: Record<string, unknown>): Record<string, unknown> {
    const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
    return {
      nit: receptorNit,
      nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
      nombre: (receptor.nombre as string) || '',
      codActividad: (receptor.codActividad as string) || '62010',
      descActividad: (receptor.descActividad as string) || 'Servicios',
      nombreComercial: (receptor.nombreComercial as string) || null,
      direccion: this.parseReceptorDireccion(receptor.direccion),
      telefono: (receptor.telefono as string) || null,
      correo: (receptor.correo as string) || '',
    };
  }

  private stripEstablishmentCodes(emisor: Record<string, unknown>): Record<string, unknown> {
    const { codEstableMH: _a, codEstable: _b, codPuntoVentaMH: _c, codPuntoVenta: _d, ...rest } = emisor;
    return rest;
  }

  private buildCcfTributos(totalGravada: number): { tributos: Array<Record<string, unknown>> | null; ivaAmount: number } {
    const IVA_RATE = 0.13;
    const ivaAmount = Math.round(totalGravada * IVA_RATE * 100) / 100;
    const tributos = totalGravada > 0 ? [{
      codigo: '20',
      descripcion: 'Impuesto al Valor Agregado 13%',
      valor: ivaAmount,
    }] : null;
    return { tributos, ivaAmount };
  }

  // =====================
  // Per-type normalizers
  // =====================

  private normalizeNotaCreditoDebito(
    tipoDte: string,
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const normalizedReceptor = this.buildCcfReceptor(receptor);

    const normalizedCuerpo = cuerpoDocumento.map(item => {
      const { ivaItem: _ivaItem, ...rest } = item;
      return {
        ...rest,
        numeroDocumento: item.numeroDocumento ?? '',
        codTributo: item.codTributo ?? null,
      };
    });

    const totalGravada = Number(resumen.totalGravada) || 0;
    const { tributos, ivaAmount } = this.buildCcfTributos(totalGravada);

    const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

    const { totalIva: _totalIva, ...resumenRest } = resumen;
    const normalizedResumen: Record<string, unknown> = {
      ...resumenRest,
      tributos,
      subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
      ivaPerci1: 0,
      ivaRete1: 0,
      reteRenta: Number(resumen.reteRenta) || 0,
      montoTotalOperacion,
      totalPagar: montoTotalOperacion,
      totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
      condicionOperacion: Number(resumen.condicionOperacion) || 1,
    };

    if (tipoDte === '06') {
      normalizedResumen.numPagoElectronico = resumen.numPagoElectronico ?? null;
    }

    return {
      identificacion: normalizedIdentificacion,
      documentoRelacionado: (data.documentoRelacionado as unknown) ?? (data.documentosRelacionados as unknown) ?? [],
      emisor: this.stripEstablishmentCodes(emisor),
      receptor: normalizedReceptor,
      ventaTercero: (data.ventaTercero as unknown) ?? null,
      cuerpoDocumento: normalizedCuerpo,
      resumen: normalizedResumen,
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeComprobanteRetencion(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const normalizedReceptor = this.buildCcfReceptor(receptor);

    const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
      numItem: (item.numItem as number) || index + 1,
      tipoDte: (item.tipoDte as string) || '03',
      tipoDoc: (item.tipoDoc as number) || 2,
      numDocumento: (item.numDocumento as string) || (item.numeroDocumento as string) || '',
      fechaEmision: (item.fechaEmision as string) || '',
      montoSujetoGrav: Number(item.montoSujetoGrav) || 0,
      codigoRetencionMH: (item.codigoRetencionMH as string) || 'C4',
      ivaRetenido: Number(item.ivaRetenido) || 0,
      descripcion: (item.descripcion as string) || '',
    }));

    const totalSujetoRetencion = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoSujetoGrav, 0) * 100) / 100;
    const totalIVAretenido = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.ivaRetenido, 0) * 100) / 100;

    return {
      identificacion: normalizedIdentificacion,
      emisor: this.stripEstablishmentCodes(emisor),
      receptor: normalizedReceptor,
      cuerpoDocumento: normalizedCuerpo,
      resumen: {
        totalSujetoRetencion,
        totalIVAretenido,
        totalIVAretenidoLetras: (resumen.totalIVAretenidoLetras as string) || numberToWords(totalIVAretenido),
      },
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeRetencionSimplificada(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const normalizedReceptor = this.buildCcfReceptor(receptor);

    const retenciones = (data.retenciones as Array<Record<string, unknown>>) || cuerpoDocumento;
    const normalizedCuerpo = retenciones.map((item, index) => ({
      numItem: (item.numItem as number) || index + 1,
      tipoImpuesto: (item.tipoImpuesto as string) || (item.tipo_impuesto as string) || 'ISR',
      descripcion: (item.descripcion as string) || '',
      tasa: Number(item.tasa) || 0,
      montoSujetoRetencion: Math.round((Number(item.montoSujetoRetencion ?? item.monto_sujeto_retencion) || 0) * 100) / 100,
      montoRetencion: Math.round((Number(item.montoRetencion ?? item.monto_retencion) || 0) * 100) / 100,
    }));

    const totalSujetoRetencion = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoSujetoRetencion, 0) * 100) / 100;
    const totalRetenido = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.montoRetencion, 0) * 100) / 100;

    return {
      identificacion: normalizedIdentificacion,
      emisor: this.stripEstablishmentCodes(emisor),
      receptor: normalizedReceptor,
      documentoRelacionado: (data.documentoRelacionado as unknown) ?? null,
      cuerpoDocumento: normalizedCuerpo,
      resumen: {
        totalSujetoRetencion,
        totalRetenido,
        totalRetenidoLetras: (resumen.totalRetenidoLetras as string) || numberToWords(totalRetenido),
      },
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeSujetoExcluido(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const sujetoExcluido = (data.sujetoExcluido as Record<string, unknown>) || receptor;

    const normalizedSujetoExcluido = {
      tipoDocumento: (sujetoExcluido.tipoDocumento as string) || '13',
      numDocumento: (sujetoExcluido.numDocumento as string) || null,
      nombre: (sujetoExcluido.nombre as string) || '',
      codActividad: (sujetoExcluido.codActividad as string) || null,
      descActividad: (sujetoExcluido.descActividad as string) || null,
      direccion: this.parseReceptorDireccion(sujetoExcluido.direccion),
      telefono: (sujetoExcluido.telefono as string) || null,
      correo: (sujetoExcluido.correo as string) || '',
    };

    const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
      numItem: (item.numItem as number) || index + 1,
      tipoItem: (item.tipoItem as number) || 1,
      cantidad: Number(item.cantidad) || 1,
      codigo: (item.codigo as string) || null,
      uniMedida: (item.uniMedida as number) || 59,
      descripcion: (item.descripcion as string) || '',
      precioUni: Number(item.precioUnitario ?? item.precioUni) || 0,
      montoDescu: Number(item.montoDescu) || 0,
      compra: Math.round((Number(item.cantidad) || 1) * Number(item.precioUnitario ?? item.precioUni ?? 0) * 100) / 100,
    }));

    const totalCompra = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.compra, 0) * 100) / 100;

    const condicionOperacion = Number(resumen.condicionOperacion) || 1;
    const pagos = condicionOperacion !== 2 ? [{
      codigo: '01',
      montoPago: totalCompra,
      referencia: null,
      plazo: null,
      periodo: null,
    }] : null;

    return {
      identificacion: normalizedIdentificacion,
      emisor,
      sujetoExcluido: normalizedSujetoExcluido,
      cuerpoDocumento: normalizedCuerpo,
      resumen: {
        totalCompra,
        descu: 0,
        totalDescu: 0,
        subTotal: totalCompra,
        ivaRete1: 0,
        reteRenta: Number(resumen.reteRenta) || 0,
        totalPagar: totalCompra,
        totalLetras: (resumen.totalLetras as string) || numberToWords(totalCompra),
        condicionOperacion,
        pagos,
        observaciones: (resumen.observaciones as string) || null,
      },
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeNotaRemision(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const normalizedReceptor = {
      ...this.buildCcfReceptor(receptor),
      bienTitulo: (receptor.bienTitulo as string) || '01',
    };

    const normalizedCuerpo = cuerpoDocumento.map(item => {
      const { ivaItem: _ivaItem, ...rest } = item;
      return {
        ...rest,
        numeroDocumento: item.numeroDocumento ?? '',
        codTributo: item.codTributo ?? null,
      };
    });

    const totalGravada = Number(resumen.totalGravada) || 0;
    const { tributos, ivaAmount } = this.buildCcfTributos(totalGravada);

    const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

    const { totalIva: _totalIva04, ...resumenRest04 } = resumen;
    const normalizedResumen04: Record<string, unknown> = {
      ...resumenRest04,
      tributos,
      subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
      ivaPerci1: 0,
      ivaRete1: 0,
      reteRenta: Number(resumen.reteRenta) || 0,
      montoTotalOperacion,
      totalPagar: montoTotalOperacion,
      totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
      condicionOperacion: Number(resumen.condicionOperacion) || 1,
    };

    return {
      identificacion: normalizedIdentificacion,
      documentoRelacionado: (data.documentoRelacionado as unknown) ?? (data.documentosRelacionados as unknown) ?? [],
      emisor,
      receptor: normalizedReceptor,
      ventaTercero: (data.ventaTercero as unknown) ?? null,
      cuerpoDocumento: normalizedCuerpo,
      resumen: normalizedResumen04,
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeDocumentoContableLiquidacion(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const { tipoContingencia: _tc, motivoContin: _mc, ...identRest09 } = identificacion;
    const normalizedIdentificacion = {
      ...identRest09,
      tipoModelo: 1,
      tipoOperacion: 1,
    };

    const receptorNit = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
    const normalizedReceptor = {
      tipoDocumento: (receptor.tipoDocumento as string) || '36',
      numDocumento: receptorNit,
      nrc: ((receptor.nrc as string) || '').replace(/-/g, ''),
      nombre: (receptor.nombre as string) || '',
      codActividad: (receptor.codActividad as string) || '62010',
      descActividad: (receptor.descActividad as string) || 'Servicios',
      nombreComercial: (receptor.nombreComercial as string) || null,
      direccion: this.parseReceptorDireccion(receptor.direccion),
      telefono: (receptor.telefono as string) || null,
      correo: (receptor.correo as string) || '',
    };

    const emisorDCL = {
      ...emisor,
      codigoMH: (emisor as Record<string, unknown>).codEstableMH,
      codigo: (emisor as Record<string, unknown>).codEstable,
      puntoVentaMH: (emisor as Record<string, unknown>).codPuntoVentaMH,
      puntoVentaContri: (emisor as Record<string, unknown>).codPuntoVenta,
    };

    const cuerpoItem = cuerpoDocumento[0] || (data.cuerpoDocumento as Record<string, unknown>) || {};
    const valorOperaciones = Number(cuerpoItem.valorOperaciones) || 0;
    const IVA_RATE = 0.13;
    const PERCEPCION_RATE = 0.02;
    const montoSinPercepcion = Number(cuerpoItem.montoSinPercepcion) || 0;
    const montoSujetoPercepcion = valorOperaciones - montoSinPercepcion;
    const ivaPercibido = Math.round(montoSujetoPercepcion * PERCEPCION_RATE * 100) / 100;
    const subTotal = Math.round(valorOperaciones * (1 + IVA_RATE) * 100) / 100;
    const comision = Number(cuerpoItem.comision) || 0;
    const ivaComision = Math.round(comision * IVA_RATE * 100) / 100;
    const liquidoApagar = Math.round((subTotal - ivaPercibido - comision - ivaComision) * 100) / 100;

    const normalizedCuerpo = {
      numItem: 1,
      tipoDte: (cuerpoItem.tipoDte as string) || '03',
      tipoGeneracion: (cuerpoItem.tipoGeneracion as number) || 1,
      numeroDocumento: (cuerpoItem.numeroDocumento as string) || null,
      periodoLiquidacionFechaInicio: (cuerpoItem.periodoLiquidacionFechaInicio as string) || '',
      periodoLiquidacionFechaFin: (cuerpoItem.periodoLiquidacionFechaFin as string) || '',
      codLiquidacion: (cuerpoItem.codLiquidacion as number) || 1,
      cantidadDoc: (cuerpoItem.cantidadDoc as number) || 1,
      valorOperaciones,
      montoSinPercepcion,
      descripcion: (cuerpoItem.descripcion as string) || '',
    };

    const normalizedResumen09 = {
      totalNoGravado: 0,
      totalGravada: valorOperaciones,
      totalIva: Math.round(valorOperaciones * IVA_RATE * 100) / 100,
      subTotal,
      montoSujetoPercepcion,
      ivaPercibido,
      comision,
      porcentComision: Number(cuerpoItem.porcentComision) || 0,
      ivaComision,
      liquidoApagar,
      totalLetras: (resumen.totalLetras as string) || numberToWords(liquidoApagar),
      observaciones: (resumen.observaciones as string) || null,
    };

    const extensionData = (data.extension as Record<string, unknown>) || {};
    const normalizedExtension = {
      nombEntrega: (extensionData.nombEntrega as string) || '',
      docuEntrega: (extensionData.docuEntrega as string) || '',
      nombRecibe: (extensionData.nombRecibe as string) || '',
      docuRecibe: (extensionData.docuRecibe as string) || '',
      observaciones: (extensionData.observaciones as string) || null,
    };

    return {
      identificacion: normalizedIdentificacion,
      emisor: emisorDCL,
      receptor: normalizedReceptor,
      cuerpoDocumento: normalizedCuerpo,
      resumen: normalizedResumen09,
      extension: normalizedExtension,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeFacturaExportacion(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const emisorData = (data.emisor as Record<string, unknown>) || {};
    const emisorExport = {
      ...emisor,
      tipoItemExpor: (emisorData.tipoItemExpor as number) || 1,
      recintoFiscal: (emisorData.recintoFiscal as string) || null,
      regimen: (emisorData.regimen as string) || null,
    };

    const normalizedReceptor = receptor.nombre ? {
      tipoDocumento: (receptor.tipoDocumento as string) || null,
      numDocumento: (receptor.numDocumento as string) || null,
      nombre: (receptor.nombre as string) || '',
      codPais: (receptor.codPais as string) || '9303',
      nombrePais: (receptor.nombrePais as string) || '',
      complemento: (receptor.complemento as string) || '',
      tipoPersona: (receptor.tipoPersona as number) || null,
      descActividad: (receptor.descActividad as string) || null,
      telefono: (receptor.telefono as string) || null,
      correo: (receptor.correo as string) || null,
    } : null;

    const normalizedCuerpo = cuerpoDocumento.map((item, index) => ({
      numItem: (item.numItem as number) || index + 1,
      cantidad: Number(item.cantidad) || 1,
      codigo: (item.codigo as string) || null,
      uniMedida: (item.uniMedida as number) || 59,
      descripcion: (item.descripcion as string) || '',
      precioUni: Number(item.precioUnitario ?? item.precioUni) || 0,
      montoDescu: Number(item.montoDescu) || 0,
      ventaGravada: Math.round((Number(item.cantidad) || 1) * Number(item.precioUnitario ?? item.precioUni ?? 0) * 100) / 100,
      tributos: null,
      noGravado: Number(item.noGravado) || 0,
    }));

    const totalGravada = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.ventaGravada, 0) * 100) / 100;
    const totalNoGravado = Math.round(normalizedCuerpo.reduce((sum, item) => sum + item.noGravado, 0) * 100) / 100;
    const flete = Number(resumen.flete ?? data.flete) || 0;
    const seguro = Number(resumen.seguro ?? data.seguro) || 0;
    const montoTotalOperacion = Math.round((totalGravada + totalNoGravado) * 100) / 100;
    const totalPagar = montoTotalOperacion;

    const normalizedResumen11 = {
      totalGravada,
      totalNoGravado,
      descuento: Number(resumen.descuento) || 0,
      porcentajeDescuento: Number(resumen.porcentajeDescuento) || 0,
      totalDescu: Number(resumen.totalDescu) || 0,
      montoTotalOperacion,
      totalPagar,
      totalLetras: (resumen.totalLetras as string) || numberToWords(totalPagar),
      condicionOperacion: Number(resumen.condicionOperacion) || 1,
      pagos: resumen.pagos ?? [{
        codigo: '01',
        montoPago: totalPagar,
        referencia: null,
        plazo: null,
        periodo: null,
      }],
      codIncoterms: (resumen.codIncoterms as string) || (data.codIncoterms as string) || null,
      descIncoterms: (resumen.descIncoterms as string) || (data.descIncoterms as string) || null,
      flete,
      seguro,
      observaciones: (resumen.observaciones as string) || (data.observaciones as string) || null,
      numPagoElectronico: (resumen.numPagoElectronico as string) || null,
    };

    return {
      identificacion: normalizedIdentificacion,
      emisor: emisorExport,
      receptor: normalizedReceptor,
      otrosDocumentos: (data.otrosDocumentos as unknown) ?? null,
      cuerpoDocumento: normalizedCuerpo,
      resumen: normalizedResumen11,
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeCreditoFiscal(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalizedIdentificacion = {
      ...identificacion,
      motivoContin: identificacion.motivoContin ?? null,
    };

    const normalizedReceptor = this.buildCcfReceptor(receptor);

    const normalizedCuerpo = cuerpoDocumento.map(item => {
      const { ivaItem: _ivaItem, ...rest } = item;
      return {
        ...rest,
        numeroDocumento: item.numeroDocumento ?? null,
        codTributo: item.codTributo ?? null,
      };
    });

    const totalGravada = Number(resumen.totalGravada) || 0;
    const { tributos, ivaAmount } = this.buildCcfTributos(totalGravada);

    const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

    const { totalIva: _totalIva, ...resumenRest } = resumen;
    const normalizedResumen = {
      ...resumenRest,
      tributos,
      subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
      ivaPerci1: 0,
      ivaRete1: 0,
      reteRenta: Number(resumen.reteRenta) || 0,
      montoTotalOperacion,
      totalPagar: montoTotalOperacion,
      totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
      saldoFavor: Number(resumen.saldoFavor) || 0,
      condicionOperacion: Number(resumen.condicionOperacion) || 1,
      pagos: resumen.pagos ?? (Number(resumen.condicionOperacion) !== 2 ? [{
        codigo: '01',
        montoPago: montoTotalOperacion,
        referencia: null,
        plazo: null,
        periodo: null,
      }] : null),
      numPagoElectronico: resumen.numPagoElectronico ?? null,
    };

    return {
      identificacion: normalizedIdentificacion,
      documentoRelacionado: (data.documentoRelacionado as unknown) ?? null,
      emisor,
      receptor: normalizedReceptor,
      otrosDocumentos: (data.otrosDocumentos as unknown) ?? null,
      ventaTercero: (data.ventaTercero as unknown) ?? null,
      cuerpoDocumento: normalizedCuerpo,
      resumen: normalizedResumen,
      extension: (data.extension as unknown) ?? null,
      apendice: (data.apendice as unknown) ?? null,
    };
  }

  private normalizeFactura(
    identificacion: Record<string, unknown>,
    receptor: Record<string, unknown>,
    cuerpoDocumento: Array<Record<string, unknown>>,
    resumen: Record<string, unknown>,
    emisor: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const receptorDireccion01 = this.parseReceptorDireccion(receptor.direccion);

    const receptorNit01 = ((receptor.nit as string) || (receptor.numDocumento as string) || '').replace(/-/g, '');
    const normalizedReceptor01 = {
      tipoDocumento: (receptor.tipoDocumento as string) || null,
      numDocumento: receptorNit01 || null,
      nrc: receptor.nrc ? ((receptor.nrc as string) || '').replace(/-/g, '') : null,
      nombre: (receptor.nombre as string) || null,
      codActividad: (receptor.codActividad as string) || null,
      descActividad: (receptor.descActividad as string) || null,
      direccion: receptorDireccion01,
      telefono: (receptor.telefono as string) || null,
      correo: (receptor.correo as string) || null,
    };

    const totalPagar01 = Number(resumen.totalPagar) || Number(resumen.montoTotalOperacion) || 0;
    const totalPagarRounded = Math.round(totalPagar01 * 100) / 100;
    const normalizedResumen01 = {
      ...resumen,
      totalGravada: Math.round((Number(resumen.totalGravada) || 0) * 100) / 100,
      subTotalVentas: Math.round((Number(resumen.subTotalVentas) || Number(resumen.totalGravada) || 0) * 100) / 100,
      subTotal: Math.round((Number(resumen.subTotal) || Number(resumen.totalGravada) || 0) * 100) / 100,
      totalIva: Math.round((Number(resumen.totalIva) || 0) * 100) / 100,
      montoTotalOperacion: totalPagarRounded,
      totalPagar: totalPagarRounded,
      totalLetras: (resumen.totalLetras as string) || numberToWords(totalPagarRounded),
      condicionOperacion: Number(resumen.condicionOperacion) || 1,
      pagos: resumen.pagos ?? [{ codigo: '01', montoPago: totalPagarRounded, referencia: null, plazo: null, periodo: null }],
    };

    const normalizedCuerpo01 = cuerpoDocumento.map((item, index) => {
      const cantidad = Number(item.cantidad) || 1;
      const precioUni = Number(item.precioUni) || 0;
      const ventaGravada = Math.round((Number(item.ventaGravada) || cantidad * precioUni) * 100) / 100;
      const ivaItem = Math.round((Number(item.ivaItem) || ventaGravada * 0.13) * 100) / 100;
      return {
        numItem: item.numItem || index + 1,
        tipoItem: Number(item.tipoItem) || 1,
        numero: item.numero ?? null,
        cantidad,
        codigo: item.codigo || null,
        codTributo: item.codTributo ?? null,
        uniMedida: Number(item.uniMedida) || 59,
        descripcion: (item.descripcion as string) || 'Servicio',
        precioUni: Math.round(precioUni * 100) / 100,
        montoDescu: Math.round((Number(item.montoDescu) || 0) * 100) / 100,
        ventaNoSuj: Math.round((Number(item.ventaNoSuj) || 0) * 100) / 100,
        ventaExenta: Math.round((Number(item.ventaExenta) || 0) * 100) / 100,
        ventaGravada,
        tributos: item.tributos ?? null,
        psv: item.psv ?? 0,
        noGravado: item.noGravado ?? 0,
        ivaItem,
      };
    });

    return {
      identificacion: {
        ...identificacion,
        motivoContin: identificacion.motivoContin ?? null,
      },
      emisor,
      receptor: normalizedReceptor01,
      cuerpoDocumento: normalizedCuerpo01,
      resumen: normalizedResumen01,
      documentoRelacionado: data.documentoRelacionado ?? null,
      otrosDocumentos: data.otrosDocumentos ?? null,
      ventaTercero: data.ventaTercero ?? null,
      extension: data.extension ?? null,
      apendice: data.apendice ?? null,
    };
  }
}
