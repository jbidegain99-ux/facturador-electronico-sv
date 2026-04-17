import * as fs from 'fs';
import * as path from 'path';
import { cle08Schema } from './cle-08.zod';

describe('CLE (08) Zod schema', () => {
  it('accepts valid CLE', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-cle-08.json'),
        'utf-8',
      ),
    );
    expect(cle08Schema.safeParse(fixture).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-cle-08.json'),
        'utf-8',
      ),
    );
    fixture.identificacion.tipoDte = '09';
    expect(cle08Schema.safeParse(fixture).success).toBe(false);
  });
});
