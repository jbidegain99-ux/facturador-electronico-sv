import { DteBuilderService } from './dte-builder.service';
import { Emisor, ReceptorCCF, ReceptorSujetoExcluido, DocumentoRelacionado } from '@facturador/shared';

describe('DteBuilderService', () => {
  let service: DteBuilderService;

  const mockEmisor: Emisor = {
    nit: '06141234567890',
    nrc: '1234567',
    nombre: 'Empresa Test',
    codActividad: '62010',
    descActividad: 'Programación informática',
    nombreComercial: 'EmpTest',
    tipoEstablecimiento: '01',
    direccion: { departamento: '06', municipio: '14', complemento: 'Col. Escalon' },
    telefono: '22223333',
    correo: 'empresa@test.com',
    codEstableMH: null,
    codEstable: null,
    codPuntoVentaMH: null,
    codPuntoVenta: null,
  };

  const mockReceptorCCF: ReceptorCCF = {
    nit: '06149876543210',
    nrc: '7654321',
    nombre: 'Cliente CCF',
    codActividad: '62010',
    descActividad: 'Programación informática',
    nombreComercial: null,
    direccion: { departamento: '06', municipio: '14', complemento: 'Col. San Benito' },
    telefono: '22224444',
    correo: 'cliente@test.com',
  };

  const mockDocRelacionado: DocumentoRelacionado[] = [{
    tipoDocumento: '03',
    tipoGeneracion: 2,
    numeroDocumento: 'DTE-03-00000001-000000000000001',
    fechaEmision: '2026-03-01',
  }];

  const mockItems = [
    { descripcion: 'Servicio A', cantidad: 2, precioUnitario: 100 },
    { descripcion: 'Servicio B', cantidad: 1, precioUnitario: 50, esExento: true },
  ];

  beforeEach(() => {
    service = new DteBuilderService();
  });

  describe('buildFactura (01)', () => {
    it('should build a valid factura with IVA', () => {
      const result = service.buildFactura({
        emisor: mockEmisor,
        items: [{ descripcion: 'Producto', cantidad: 1, precioUnitario: 100 }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('01');
      expect(result.identificacion.version).toBe(1);
      expect(result.resumen.totalGravada).toBe(100);
      expect(result.resumen.totalIva).toBe(13);
      expect(result.resumen.totalPagar).toBe(113);
    });
  });

  describe('buildNotaCredito (05)', () => {
    it('should build a valid nota de crédito', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorNC } = mockEmisor;
      const result = service.buildNotaCredito({
        emisor: emisorNC,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Devolución Servicio A', cantidad: 1, precioUnitario: 100, numeroDocumento: 'DTE-03-00000001-000000000000001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('05');
      expect(result.identificacion.version).toBe(3);
      expect(result.documentoRelacionado).toHaveLength(1);
      expect(result.documentoRelacionado[0].numeroDocumento).toBe('DTE-03-00000001-000000000000001');
      expect(result.resumen.totalGravada).toBe(100);
      expect(result.resumen.montoTotalOperacion).toBe(113);
      expect(result.resumen.ivaPerci1).toBe(0);
      expect(result.resumen.ivaRete1).toBe(0);
    });

    it('should handle exempt items in nota de crédito', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorNC } = mockEmisor;
      const result = service.buildNotaCredito({
        emisor: emisorNC,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Devolución', cantidad: 1, precioUnitario: 50, esExento: true, numeroDocumento: 'DOC-001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.resumen.totalExenta).toBe(50);
      expect(result.resumen.totalGravada).toBe(0);
      expect(result.resumen.tributos).toBeNull();
    });

    it('should include numeroDocumento in each item', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorNC } = mockEmisor;
      const result = service.buildNotaCredito({
        emisor: emisorNC,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Item 1', cantidad: 1, precioUnitario: 100, numeroDocumento: 'DOC-REF-001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.cuerpoDocumento[0].numeroDocumento).toBe('DOC-REF-001');
    });
  });

  describe('buildNotaDebito (06)', () => {
    it('should build a valid nota de débito', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorND } = mockEmisor;
      const result = service.buildNotaDebito({
        emisor: emisorND,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Cargo adicional', cantidad: 1, precioUnitario: 200, numeroDocumento: 'DTE-03-00000001-000000000000001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('06');
      expect(result.identificacion.version).toBe(3);
      expect(result.documentoRelacionado).toHaveLength(1);
      expect(result.resumen.totalGravada).toBe(200);
      expect(result.resumen.numPagoElectronico).toBeNull();
    });

    it('should calculate IVA at 13% for gravado items', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorND } = mockEmisor;
      const result = service.buildNotaDebito({
        emisor: emisorND,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Recargo', cantidad: 1, precioUnitario: 1000, numeroDocumento: 'DOC-001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.resumen.tributos).not.toBeNull();
      expect(result.resumen.tributos![0].valor).toBe(130);
      expect(result.resumen.montoTotalOperacion).toBe(1130);
    });
  });

  describe('buildComprobanteRetencion (07)', () => {
    it('should build a valid comprobante de retención', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorRet } = mockEmisor;
      const result = service.buildComprobanteRetencion({
        emisor: emisorRet,
        receptor: mockReceptorCCF,
        items: [{
          tipoDte: '03',
          tipoDoc: 2,
          numDocumento: 'DTE-03-00000001-000000000000001',
          fechaEmision: '2026-03-01',
          montoSujetoGrav: 1000,
          codigoRetencionMH: 'C4',
          ivaRetenido: 10,
          descripcion: 'Retención IVA 1%',
        }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('07');
      expect(result.identificacion.version).toBe(3);
      expect(result.cuerpoDocumento).toHaveLength(1);
      expect(result.resumen.totalSujetoRetencion).toBe(1000);
      expect(result.resumen.totalIVAretenido).toBe(10);
      expect(result.resumen.totalIVAretenidoLetras).toContain('USD');
    });

    it('should sum multiple retention items', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorRet } = mockEmisor;
      const result = service.buildComprobanteRetencion({
        emisor: emisorRet,
        receptor: mockReceptorCCF,
        items: [
          { tipoDte: '03', tipoDoc: 2, numDocumento: 'DOC-1', fechaEmision: '2026-03-01', montoSujetoGrav: 500, codigoRetencionMH: 'C4', ivaRetenido: 5, descripcion: 'Retención 1' },
          { tipoDte: '03', tipoDoc: 2, numDocumento: 'DOC-2', fechaEmision: '2026-03-02', montoSujetoGrav: 300, codigoRetencionMH: 'C4', ivaRetenido: 3, descripcion: 'Retención 2' },
        ],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.resumen.totalSujetoRetencion).toBe(800);
      expect(result.resumen.totalIVAretenido).toBe(8);
    });
  });

  describe('buildSujetoExcluido (14)', () => {
    const mockSujetoExcluido: ReceptorSujetoExcluido = {
      tipoDocumento: '13',
      numDocumento: '012345678',
      nombre: 'Juan Pérez',
      codActividad: null,
      descActividad: null,
      direccion: { departamento: '06', municipio: '14', complemento: 'Barrio El Centro' },
      telefono: '77778888',
      correo: 'juan@test.com',
    };

    it('should build a valid factura de sujeto excluido without IVA', () => {
      const result = service.buildSujetoExcluido({
        emisor: mockEmisor,
        sujetoExcluido: mockSujetoExcluido,
        items: [{ descripcion: 'Compra de maíz', cantidad: 10, precioUnitario: 5 }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('14');
      expect(result.identificacion.version).toBe(1);
      expect(result.sujetoExcluido.nombre).toBe('Juan Pérez');
      expect(result.resumen.totalCompra).toBe(50);
      expect(result.resumen.totalPagar).toBe(50);
      expect(result.resumen.ivaRete1).toBe(0);
      expect(result.resumen.reteRenta).toBe(0);
    });

    it('should calculate compra per item correctly', () => {
      const result = service.buildSujetoExcluido({
        emisor: mockEmisor,
        sujetoExcluido: mockSujetoExcluido,
        items: [
          { descripcion: 'Producto A', cantidad: 3, precioUnitario: 10 },
          { descripcion: 'Producto B', cantidad: 2, precioUnitario: 25 },
        ],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.cuerpoDocumento[0].compra).toBe(30);
      expect(result.cuerpoDocumento[1].compra).toBe(50);
      expect(result.resumen.totalCompra).toBe(80);
    });

    it('should generate pagos for contado operations', () => {
      const result = service.buildSujetoExcluido({
        emisor: mockEmisor,
        sujetoExcluido: mockSujetoExcluido,
        items: [{ descripcion: 'Compra', cantidad: 1, precioUnitario: 100 }],
        codEstablecimiento: '0001',
        correlativo: 1,
        condicionOperacion: 1,
      });

      expect(result.resumen.pagos).not.toBeNull();
      expect(result.resumen.pagos![0].montoPago).toBe(100);
    });

    it('should not generate pagos for credito operations', () => {
      const result = service.buildSujetoExcluido({
        emisor: mockEmisor,
        sujetoExcluido: mockSujetoExcluido,
        items: [{ descripcion: 'Compra', cantidad: 1, precioUnitario: 100 }],
        codEstablecimiento: '0001',
        correlativo: 1,
        condicionOperacion: 2,
      });

      expect(result.resumen.pagos).toBeNull();
    });
  });

  describe('buildCRS (34)', () => {
    it('should build a valid CRS with multiple retenciones', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const result = service.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR 10%', tasa: 0.10, montoSujetoRetencion: 1000, montoRetencion: 100 },
          { tipoImpuesto: 'IVA', descripcion: 'IVA 1%', tasa: 0.01, montoSujetoRetencion: 1000, montoRetencion: 10 },
        ],
        montoTotalRetencion: 110,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.identificacion.tipoDte).toBe('34');
      expect(result.identificacion.version).toBe(1);
      expect(result.cuerpoDocumento).toHaveLength(2);
      expect(result.resumen.totalRetenido).toBe(110);
      expect(result.resumen.totalSujetoRetencion).toBe(2000);
      expect(result.resumen.totalRetenidoLetras).toContain('USD');
    });

    it('should calculate single retencion correctly', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const result = service.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR 1%', tasa: 0.01, montoSujetoRetencion: 5000, montoRetencion: 50 },
        ],
        montoTotalRetencion: 50,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.cuerpoDocumento[0].montoRetencion).toBe(50);
      expect(result.cuerpoDocumento[0].tipoImpuesto).toBe('ISR');
      expect(result.resumen.totalRetenido).toBe(50);
    });

    it('should throw when total does not match sum of retenciones', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      expect(() => {
        service.buildCRS({
          emisor: emisorCRS,
          receptor: mockReceptorCCF,
          retenciones: [
            { tipoImpuesto: 'ISR', descripcion: 'ISR 10%', tasa: 0.10, montoSujetoRetencion: 1000, montoRetencion: 100 },
          ],
          montoTotalRetencion: 999, // Does not match
          codEstablecimiento: '0001',
          correlativo: 1,
        });
      }).toThrow('Monto total retención');
    });

    it('should support all tipoImpuesto values', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const result = service.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR', tasa: 0.10, montoSujetoRetencion: 100, montoRetencion: 10 },
          { tipoImpuesto: 'IVA', descripcion: 'IVA', tasa: 0.01, montoSujetoRetencion: 100, montoRetencion: 1 },
          { tipoImpuesto: 'ISSS', descripcion: 'ISSS', tasa: 0.03, montoSujetoRetencion: 100, montoRetencion: 3 },
          { tipoImpuesto: 'AFP', descripcion: 'AFP', tasa: 0.07, montoSujetoRetencion: 100, montoRetencion: 7 },
          { tipoImpuesto: 'OTRO', descripcion: 'Otro', tasa: 0.05, montoSujetoRetencion: 100, montoRetencion: 5 },
        ],
        montoTotalRetencion: 26,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.cuerpoDocumento).toHaveLength(5);
      expect(result.resumen.totalRetenido).toBe(26);
    });

    it('should include documentoRelacionado when provided', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const result = service.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR 10%', tasa: 0.10, montoSujetoRetencion: 1000, montoRetencion: 100 },
        ],
        montoTotalRetencion: 100,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      expect(result.documentoRelacionado).toHaveLength(1);
      expect(result.documentoRelacionado![0].numeroDocumento).toBe('DTE-03-00000001-000000000000001');
    });
  });

  describe('generateNumeroControl', () => {
    it('should generate correct format for each DTE type', () => {
      expect(service.generateNumeroControl('05', '0001', 1)).toMatch(/^DTE-05-00000001-000000000000001$/);
      expect(service.generateNumeroControl('06', '0001', 1)).toMatch(/^DTE-06-00000001-000000000000001$/);
      expect(service.generateNumeroControl('07', '0001', 1)).toMatch(/^DTE-07-00000001-000000000000001$/);
      expect(service.generateNumeroControl('14', '0001', 1)).toMatch(/^DTE-14-00000001-000000000000001$/);
      expect(service.generateNumeroControl('34', '0001', 1)).toMatch(/^DTE-34-00000001-000000000000001$/);
    });
  });
});
