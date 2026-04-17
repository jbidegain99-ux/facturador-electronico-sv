import * as fs from 'fs';
import * as path from 'path';
import { fexe11Schema } from './fexe-11.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'),
  );
}

describe('FEXE (11) Zod schema', () => {
  it('accepts valid FEXE', () => {
    expect(fexe11Schema.safeParse(loadFixture('valid-fexe-11.json')).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = loadFixture('valid-fexe-11.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '01';
    expect(fexe11Schema.safeParse(fixture).success).toBe(false);
  });
});
