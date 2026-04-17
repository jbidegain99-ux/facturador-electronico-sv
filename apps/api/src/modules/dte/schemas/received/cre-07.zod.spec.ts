import * as fs from 'fs';
import * as path from 'path';
import { cre07Schema } from './cre-07.zod';

describe('CRE (07) Zod schema', () => {
  it('accepts valid CRE', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-cre-07.json'),
        'utf-8',
      ),
    );
    expect(cre07Schema.safeParse(fixture).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-cre-07.json'),
        'utf-8',
      ),
    );
    fixture.identificacion.tipoDte = '03';
    expect(cre07Schema.safeParse(fixture).success).toBe(false);
  });
});
