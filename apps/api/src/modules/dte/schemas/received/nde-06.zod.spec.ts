import * as fs from 'fs';
import * as path from 'path';
import { nde06Schema } from './nde-06.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'),
  );
}

describe('NDE (06) Zod schema', () => {
  it('accepts valid NDE', () => {
    expect(nde06Schema.safeParse(loadFixture('valid-nde-06.json')).success).toBe(true);
  });

  it('extracts docsAsociados correctly', () => {
    const result = nde06Schema.parse(loadFixture('valid-nde-06.json'));
    expect(result.docsAsociados).toHaveLength(1);
    expect(result.docsAsociados[0].tipoDoc).toBe('03');
  });

  it('rejects NDE with tipoDte 05', () => {
    const fixture = loadFixture('valid-nde-06.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '05';
    expect(nde06Schema.safeParse(fixture).success).toBe(false);
  });

  it('rejects NDE with empty docsAsociados', () => {
    const fixture = loadFixture('valid-nde-06.json') as { docsAsociados: unknown[] };
    fixture.docsAsociados = [];
    expect(nde06Schema.safeParse(fixture).success).toBe(false);
  });
});
