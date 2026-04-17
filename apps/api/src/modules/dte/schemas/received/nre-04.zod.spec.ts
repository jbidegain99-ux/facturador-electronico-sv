import * as fs from 'fs';
import * as path from 'path';
import { nre04Schema } from './nre-04.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'),
  );
}

describe('NRE (04) Zod schema', () => {
  it('accepts valid NRE', () => {
    expect(nre04Schema.safeParse(loadFixture('valid-nre-04.json')).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = loadFixture('valid-nre-04.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '03';
    expect(nre04Schema.safeParse(fixture).success).toBe(false);
  });
});
