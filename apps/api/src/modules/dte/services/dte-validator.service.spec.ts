import { DteValidatorService } from './dte-validator.service';
import { DteBuilderService } from './dte-builder.service';
import { Emisor, ReceptorCCF, ReceptorSujetoExcluido, DocumentoRelacionado } from '@facturador/shared';

describe('DteValidatorService', () => {
  let validator: DteValidatorService;
  let builder: DteBuilderService;

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

  beforeEach(() => {
    validator = new DteValidatorService();
    builder = new DteBuilderService();
  });

  describe('schemas available', () => {
    it('should have schemas for all 10 DTE types', () => {
      const types = ['01', '03', '04', '05', '06', '07', '09', '11', '14', '34'];
      for (const tipo of types) {
        // Build a minimal DTE and check schema doesn't return "not implemented"
        const result = validator.validate({
          identificacion: { tipoDte: tipo },
        } as never);

        // If schema exists, errors should be about field validation, not "Schema not implemented"
        if (!result.valid) {
          const notImplementedError = result.errors.find(e => e.message.includes('Schema not implemented'));
          expect(notImplementedError).toBeUndefined();
        }
      }
    });
  });

  describe('validate Nota de Crédito (05)', () => {
    it('should validate a well-formed NC built by the builder', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorNC } = mockEmisor;
      const nc = builder.buildNotaCredito({
        emisor: emisorNC,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Devolución', cantidad: 1, precioUnitario: 100, numeroDocumento: 'DTE-03-00000001-000000000000001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      const result = validator.validate(nc as never);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject NC without documentoRelacionado', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorNC } = mockEmisor;
      const nc = builder.buildNotaCredito({
        emisor: emisorNC,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Devolución', cantidad: 1, precioUnitario: 100, numeroDocumento: 'DOC-1' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      // Remove documentoRelacionado
      (nc as unknown as Record<string, unknown>).documentoRelacionado = [];

      const result = validator.validate(nc as never);
      expect(result.valid).toBe(false);
    });
  });

  describe('validate Nota de Débito (06)', () => {
    it('should validate a well-formed ND built by the builder', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorND } = mockEmisor;
      const nd = builder.buildNotaDebito({
        emisor: emisorND,
        receptor: mockReceptorCCF,
        documentoRelacionado: mockDocRelacionado,
        items: [{ descripcion: 'Cargo', cantidad: 1, precioUnitario: 200, numeroDocumento: 'DTE-03-00000001-000000000000001' }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      const result = validator.validate(nd as never);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate Comprobante de Retención (07)', () => {
    it('should validate a well-formed retention built by the builder', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorRet } = mockEmisor;
      const ret = builder.buildComprobanteRetencion({
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
          descripcion: 'Retención IVA',
        }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      const result = validator.validate(ret as never);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate Factura Sujeto Excluido (14)', () => {
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

    it('should validate a well-formed FSE built by the builder', () => {
      const fse = builder.buildSujetoExcluido({
        emisor: mockEmisor,
        sujetoExcluido: mockSujetoExcluido,
        items: [{ descripcion: 'Compra de maíz', cantidad: 10, precioUnitario: 5 }],
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      const result = validator.validate(fse as never);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate Comprobante de Retención CRS (34)', () => {
    it('should validate a well-formed CRS built by the builder', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const crs = builder.buildCRS({
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

      const result = validator.validate(crs as never);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject CRS with empty retenciones', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const crs = builder.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR', tasa: 0.10, montoSujetoRetencion: 100, montoRetencion: 10 },
        ],
        montoTotalRetencion: 10,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      // Remove all items
      (crs as unknown as Record<string, unknown>).cuerpoDocumento = [];

      const result = validator.validate(crs as never);
      expect(result.valid).toBe(false);
    });

    it('should reject CRS with invalid tipoImpuesto', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const crs = builder.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR', tasa: 0.10, montoSujetoRetencion: 100, montoRetencion: 10 },
        ],
        montoTotalRetencion: 10,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      // Set invalid tipoImpuesto
      (crs.cuerpoDocumento[0] as unknown as Record<string, unknown>).tipoImpuesto = 'INVALID';

      const result = validator.validate(crs as never);
      expect(result.valid).toBe(false);
    });

    it('should reject CRS with tasa > 1', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const crs = builder.buildCRS({
        emisor: emisorCRS,
        receptor: mockReceptorCCF,
        retenciones: [
          { tipoImpuesto: 'ISR', descripcion: 'ISR', tasa: 0.10, montoSujetoRetencion: 100, montoRetencion: 10 },
        ],
        montoTotalRetencion: 10,
        codEstablecimiento: '0001',
        correlativo: 1,
      });

      // Set tasa > 1
      (crs.cuerpoDocumento[0] as unknown as Record<string, unknown>).tasa = 1.5;

      const result = validator.validate(crs as never);
      expect(result.valid).toBe(false);
    });

    it('should validate CRS with documentoRelacionado', () => {
      const { codEstableMH: _, codEstable: __, codPuntoVentaMH: ___, codPuntoVenta: ____, ...emisorCRS } = mockEmisor;
      const crs = builder.buildCRS({
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

      const result = validator.validate(crs as never);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNumeroControl', () => {
    it('should validate numero control for all new DTE types', () => {
      expect(validator.validateNumeroControl('DTE-05-00000001-000000000000001', '05')).toBe(true);
      expect(validator.validateNumeroControl('DTE-06-00000001-000000000000001', '06')).toBe(true);
      expect(validator.validateNumeroControl('DTE-07-00000001-000000000000001', '07')).toBe(true);
      expect(validator.validateNumeroControl('DTE-14-00000001-000000000000001', '14')).toBe(true);
      expect(validator.validateNumeroControl('DTE-34-00000001-000000000000001', '34')).toBe(true);
    });

    it('should reject mismatched tipo in numero control', () => {
      expect(validator.validateNumeroControl('DTE-01-00000001-000000000000001', '05')).toBe(false);
    });
  });
});
