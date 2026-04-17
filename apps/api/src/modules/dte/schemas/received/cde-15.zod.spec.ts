import * as fs from 'fs';
import * as path from 'path';
import { cde15Schema } from './cde-15.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'),
  );
}

describe('CDE (15) Zod schema', () => {
  it('accepts valid CDE', () => {
    expect(cde15Schema.safeParse(loadFixture('valid-cde-15.json')).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = loadFixture('valid-cde-15.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '01';
    expect(cde15Schema.safeParse(fixture).success).toBe(false);
  });
});
