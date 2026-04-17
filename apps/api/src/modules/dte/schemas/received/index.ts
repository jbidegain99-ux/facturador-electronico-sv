import { fe01Schema, FE01 } from './fe-01.zod';
import { ccfe03Schema, CCFE03 } from './ccfe-03.zod';
import { nre04Schema, NRE04 } from './nre-04.zod';
import { nce05Schema, NCE05 } from './nce-05.zod';
import { nde06Schema, NDE06 } from './nde-06.zod';
import { cre07Schema, CRE07 } from './cre-07.zod';
import { cle08Schema, CLE08 } from './cle-08.zod';
import { dcle09Schema, DCLE09 } from './dcle-09.zod';
import { fexe11Schema, FEXE11 } from './fexe-11.zod';
import { fsee14Schema, FSEE14 } from './fsee-14.zod';
import { cde15Schema, CDE15 } from './cde-15.zod';

export type DteTipoCode = '01' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '11' | '14' | '15';

export type AnyDteSchema =
  | typeof fe01Schema
  | typeof ccfe03Schema
  | typeof nre04Schema
  | typeof nce05Schema
  | typeof nde06Schema
  | typeof cre07Schema
  | typeof cle08Schema
  | typeof dcle09Schema
  | typeof fexe11Schema
  | typeof fsee14Schema
  | typeof cde15Schema;

export type AnyDteParsed =
  | FE01 | CCFE03 | NRE04 | NCE05 | NDE06 | CRE07
  | CLE08 | DCLE09 | FEXE11 | FSEE14 | CDE15;

export const DTE_SCHEMAS_BY_TIPO: Record<DteTipoCode, AnyDteSchema> = {
  '01': fe01Schema,
  '03': ccfe03Schema,
  '04': nre04Schema,
  '05': nce05Schema,
  '06': nde06Schema,
  '07': cre07Schema,
  '08': cle08Schema,
  '09': dcle09Schema,
  '11': fexe11Schema,
  '14': fsee14Schema,
  '15': cde15Schema,
};

export function getSchemaForTipo(tipoDte: DteTipoCode): AnyDteSchema {
  const schema = DTE_SCHEMAS_BY_TIPO[tipoDte];
  if (!schema) {
    throw new Error(`No Zod schema registered for tipoDte ${tipoDte}`);
  }
  return schema;
}

// Re-export individual schemas + types
export {
  fe01Schema, ccfe03Schema, nre04Schema, nce05Schema, nde06Schema,
  cre07Schema, cle08Schema, dcle09Schema, fexe11Schema, fsee14Schema, cde15Schema,
};
export type {
  FE01, CCFE03, NRE04, NCE05, NDE06, CRE07, CLE08, DCLE09, FEXE11, FSEE14, CDE15,
};
