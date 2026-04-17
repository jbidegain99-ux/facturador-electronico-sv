import * as fs from 'fs';
import * as path from 'path';
import { nce05Schema } from './nce-05.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'),
  );
}

describe('NCE (05) Zod schema', () => {
  it('accepts valid NCE', () => {
    expect(nce05Schema.safeParse(loadFixture('valid-nce-05.json')).success).toBe(true);
  });

  it('extracts docsAsociados correctly', () => {
    const result = nce05Schema.parse(loadFixture('valid-nce-05.json'));
    expect(result.docsAsociados).toHaveLength(1);
    expect(result.docsAsociados[0].tipoDoc).toBe('03');
  });

  it('rejects NCE with tipoDte 06', () => {
    const fixture = loadFixture('valid-nce-05.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '06';
    expect(nce05Schema.safeParse(fixture).success).toBe(false);
  });

  it('rejects NCE with empty docsAsociados', () => {
    const fixture = loadFixture('valid-nce-05.json') as { docsAsociados: unknown[] };
    fixture.docsAsociados = [];
    expect(nce05Schema.safeParse(fixture).success).toBe(false);
  });
});
