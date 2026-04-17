import * as fs from 'fs';
import * as path from 'path';
import { dcle09Schema } from './dcle-09.zod';

describe('DCLE (09) Zod schema', () => {
  it('accepts valid DCLE', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-dcle-09.json'),
        'utf-8',
      ),
    );
    expect(dcle09Schema.safeParse(fixture).success).toBe(true);
  });

  it('rejects wrong tipoDte', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../__fixtures__/received/valid-dcle-09.json'),
        'utf-8',
      ),
    );
    fixture.identificacion.tipoDte = '08';
    expect(dcle09Schema.safeParse(fixture).success).toBe(false);
  });
});
