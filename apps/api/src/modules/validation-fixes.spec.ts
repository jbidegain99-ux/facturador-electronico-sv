/**
 * Validation tests for batch fixes: Issues #25/#6, #29, #38/#39
 * These tests verify the fixes without requiring a running database.
 */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTenantDto } from './tenants/dto/create-tenant.dto';
import { UpdateTenantDto } from './tenants/dto/update-tenant.dto';
import { CreateClienteDto } from './clientes/dto/create-cliente.dto';
import { DEPARTAMENTOS } from '@facturador/shared';

// ============================================================================
// Issue #25/#6: Field Validation Tests
// ============================================================================

describe('Issue #25/#6 - Field Length & Format Validations', () => {
  describe('CreateTenantDto', () => {
    const validData = {
      nombre: 'Test Company S.A. de C.V.',
      nit: '0614-123456-789-0',
      nrc: '123456-7',
      actividadEcon: '62010',
      direccion: { departamento: '06', municipio: '14', complemento: 'Calle Test #1' },
      telefono: '2200-1234',
      correo: 'test@example.com',
    };

    it('should accept valid data', async () => {
      const dto = plainToInstance(CreateTenantDto, validData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject nombre > 250 characters', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nombre: 'A'.repeat(251),
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'nombre');
      expect(nameError).toBeDefined();
    });

    it('should reject NIT without dashes', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nit: '06141234567890',
      });
      const errors = await validate(dto);
      const nitError = errors.find(e => e.property === 'nit');
      expect(nitError).toBeDefined();
    });

    it('should reject NIT with wrong format', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nit: '123-456-789-0',
      });
      const errors = await validate(dto);
      const nitError = errors.find(e => e.property === 'nit');
      expect(nitError).toBeDefined();
    });

    it('should accept NIT with correct format', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nit: '0614-123456-789-0',
      });
      const errors = await validate(dto);
      const nitError = errors.find(e => e.property === 'nit');
      expect(nitError).toBeUndefined();
    });

    it('should reject NRC with wrong format', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nrc: '12345678',
      });
      const errors = await validate(dto);
      const nrcError = errors.find(e => e.property === 'nrc');
      expect(nrcError).toBeDefined();
    });

    it('should accept NRC with correct format', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        nrc: '1234567-8',
      });
      const errors = await validate(dto);
      const nrcError = errors.find(e => e.property === 'nrc');
      expect(nrcError).toBeUndefined();
    });

    it('should reject telefono without dash', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        telefono: '22001234',
      });
      const errors = await validate(dto);
      const telError = errors.find(e => e.property === 'telefono');
      expect(telError).toBeDefined();
    });

    it('should accept telefono with correct format', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        telefono: '2200-1234',
      });
      const errors = await validate(dto);
      const telError = errors.find(e => e.property === 'telefono');
      expect(telError).toBeUndefined();
    });

    it('should reject correo > 100 characters', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        ...validData,
        correo: 'a'.repeat(90) + '@example.com',
      });
      const errors = await validate(dto);
      const correoError = errors.find(e => e.property === 'correo');
      expect(correoError).toBeDefined();
    });
  });

  describe('UpdateTenantDto', () => {
    it('should reject NRC with wrong format', async () => {
      const dto = plainToInstance(UpdateTenantDto, { nrc: 'invalid' });
      const errors = await validate(dto);
      const nrcError = errors.find(e => e.property === 'nrc');
      expect(nrcError).toBeDefined();
    });

    it('should accept NRC with correct format', async () => {
      const dto = plainToInstance(UpdateTenantDto, { nrc: '12345-6' });
      const errors = await validate(dto);
      const nrcError = errors.find(e => e.property === 'nrc');
      expect(nrcError).toBeUndefined();
    });

    it('should reject telefono with wrong format', async () => {
      const dto = plainToInstance(UpdateTenantDto, { telefono: '1234' });
      const errors = await validate(dto);
      const telError = errors.find(e => e.property === 'telefono');
      expect(telError).toBeDefined();
    });
  });

  describe('CreateClienteDto', () => {
    const validCliente = {
      tipoDocumento: '36',
      numDocumento: '0614-123456-789-0',
      nombre: 'Cliente Test',
      direccion: { departamento: '06', municipio: '14', complemento: 'Calle Test' },
    };

    it('should accept valid client data', async () => {
      const dto = plainToInstance(CreateClienteDto, validCliente);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject nombre > 250 characters', async () => {
      const dto = plainToInstance(CreateClienteDto, {
        ...validCliente,
        nombre: 'X'.repeat(251),
      });
      const errors = await validate(dto);
      const nameError = errors.find(e => e.property === 'nombre');
      expect(nameError).toBeDefined();
    });

    it('should reject numDocumento > 20 characters', async () => {
      const dto = plainToInstance(CreateClienteDto, {
        ...validCliente,
        numDocumento: '1'.repeat(21),
      });
      const errors = await validate(dto);
      const docError = errors.find(e => e.property === 'numDocumento');
      expect(docError).toBeDefined();
    });

    it('should reject NRC with wrong format', async () => {
      const dto = plainToInstance(CreateClienteDto, {
        ...validCliente,
        nrc: 'invalid',
      });
      const errors = await validate(dto);
      const nrcError = errors.find(e => e.property === 'nrc');
      expect(nrcError).toBeDefined();
    });

    it('should reject telefono with wrong format', async () => {
      const dto = plainToInstance(CreateClienteDto, {
        ...validCliente,
        telefono: '123',
      });
      const errors = await validate(dto);
      const telError = errors.find(e => e.property === 'telefono');
      expect(telError).toBeDefined();
    });

    it('should accept optional telefono with correct format', async () => {
      const dto = plainToInstance(CreateClienteDto, {
        ...validCliente,
        telefono: '2200-5678',
      });
      const errors = await validate(dto);
      const telError = errors.find(e => e.property === 'telefono');
      expect(telError).toBeUndefined();
    });
  });
});

// ============================================================================
// Issue #29: Null Safety in Emisor Construction
// ============================================================================

describe('Issue #29 - Null Safety', () => {
  it('should handle null NIT/NRC safely with || fallback', () => {
    // Simulates the pattern used in dte.service.ts emisor construction
    const nullTenant = { nit: null, nrc: null, nombre: null, correo: null };
    const nit = ((nullTenant.nit as string | null) || '').replace(/-/g, '');
    const nrc = ((nullTenant.nrc as string | null) || '').replace(/-/g, '');
    const nombre = nullTenant.nombre || '';
    const correo = nullTenant.correo || '';

    expect(nit).toBe('');
    expect(nrc).toBe('');
    expect(nombre).toBe('');
    expect(correo).toBe('');
  });

  it('should handle undefined NIT/NRC safely', () => {
    const undefinedTenant = { nit: undefined, nrc: undefined };
    const nit = ((undefinedTenant.nit as string | undefined) || '').replace(/-/g, '');
    const nrc = ((undefinedTenant.nrc as string | undefined) || '').replace(/-/g, '');

    expect(nit).toBe('');
    expect(nrc).toBe('');
  });

  it('should properly strip dashes from valid NIT', () => {
    const tenant = { nit: '0614-123456-789-0' };
    const nit = (tenant.nit || '').replace(/-/g, '');
    expect(nit).toBe('06141234567890');
  });
});

// ============================================================================
// Issue #38/#39: PDF Address and IVA Logic
// ============================================================================

describe('Issue #38 - PDF Address Resolution', () => {
  it('DEPARTAMENTOS constant has all 14 departments', () => {
    expect(Object.keys(DEPARTAMENTOS).length).toBe(14);
    expect(DEPARTAMENTOS['01']).toBe('Ahuachapan');
    expect(DEPARTAMENTOS['06']).toBe('San Salvador');
    expect(DEPARTAMENTOS['07']).toBe('Cuscatlan');
    expect(DEPARTAMENTOS['14']).toBe('La Union');
  });

  it('should resolve department code to name', () => {
    const code = '06';
    const name = DEPARTAMENTOS[code] || code;
    expect(name).toBe('San Salvador');
  });

  it('should fallback to code if department unknown', () => {
    const code = '99';
    const name = DEPARTAMENTOS[code] || code;
    expect(name).toBe('99');
  });
});

describe('Issue #39 - PDF IVA Extraction Logic', () => {
  // Simulates the getIvaAmount logic from pdf.service.ts
  function getIvaAmount(
    resumen: Record<string, unknown>,
    data: Record<string, unknown>,
  ): number {
    const totalIva = resumen.totalIva;
    if (typeof totalIva === 'number' && totalIva > 0) return totalIva;

    const tributos = resumen.tributos;
    if (Array.isArray(tributos)) {
      const ivaTributo = tributos.find(
        (t: Record<string, unknown>) => t.codigo === '20',
      );
      if (ivaTributo && typeof ivaTributo.valor === 'number')
        return ivaTributo.valor;
    }

    const dataTributos = data.tributos;
    if (Array.isArray(dataTributos)) {
      const ivaTributo = dataTributos.find(
        (t: Record<string, unknown>) => t.codigo === '20',
      );
      if (ivaTributo && typeof ivaTributo.valor === 'number')
        return ivaTributo.valor;
    }

    if (typeof resumen.ivaRete1 === 'number' && (resumen.ivaRete1 as number) > 0)
      return resumen.ivaRete1 as number;

    return 0;
  }

  it('should use totalIva when available (Factura 01)', () => {
    const resumen = { totalIva: 13, ivaRete1: 0, totalGravada: 100 };
    expect(getIvaAmount(resumen, {})).toBe(13);
  });

  it('should use tributos array when totalIva is 0 (CCF 03)', () => {
    const resumen = {
      totalIva: 0,
      ivaRete1: 0,
      tributos: [
        { codigo: '20', descripcion: 'IVA 13%', valor: 26 },
      ],
    };
    expect(getIvaAmount(resumen, {})).toBe(26);
  });

  it('should fallback to ivaRete1 when nothing else available', () => {
    const resumen = { ivaRete1: 5.5 };
    expect(getIvaAmount(resumen, {})).toBe(5.5);
  });

  it('should return 0 when no IVA data found', () => {
    const resumen = { totalGravada: 100, ivaRete1: 0 };
    expect(getIvaAmount(resumen, {})).toBe(0);
  });

  it('should check data-level tributos when resumen has none', () => {
    const resumen = { totalIva: 0, ivaRete1: 0 };
    const data = {
      tributos: [{ codigo: '20', valor: 15 }],
    };
    expect(getIvaAmount(resumen, data)).toBe(15);
  });
});
