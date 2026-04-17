import { getSchemaForTipo, DTE_SCHEMAS_BY_TIPO, DteTipoCode } from './index';

describe('DTE schemas dispatcher', () => {
  it('returns a schema for every valid tipoDte', () => {
    const allCodes: DteTipoCode[] = ['01', '03', '04', '05', '06', '07', '08', '09', '11', '14', '15'];
    for (const code of allCodes) {
      const schema = getSchemaForTipo(code);
      expect(schema).toBeDefined();
    }
  });

  it('DTE_SCHEMAS_BY_TIPO has exactly 11 entries', () => {
    expect(Object.keys(DTE_SCHEMAS_BY_TIPO)).toHaveLength(11);
  });
});
