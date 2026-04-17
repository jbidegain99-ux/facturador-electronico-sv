# Execution Evidence — Fase 1.3: DTE Parser + Verifier

**Date:** 2026-04-17
**Branch:** `feature/dte-import-parser`
**Status:** ✅ COMPLETE — ready for review + push
**Spec:** `outputs/2026-04-17-fase-1-3-dte-parser-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-3-dte-parser-implementation.md`

---

## What was built

### Services (2 new, pure, no I/O by design)

- **`DteImportParserService`** (`apps/api/src/modules/dte/services/dte-import-parser.service.ts`)
  - Public API: `parse(jsonString, expectedType?)` and `parseObject(obj, expectedType?, rawOverride?)`
  - Validates all 11 DTE types via Zod schemas (dispatched by `tipoDte`)
  - Normalizes nested MH JSON structure → flat `ParsedDTE`
  - Maps Zod errors to typed `ParseErrorCode` (INVALID_JSON, MISSING_FIELD, INVALID_NIT, INVALID_UUID, INVALID_NUMERO_CONTROL, INVALID_TIPO_DTE, ARITHMETIC_MISMATCH, EMPTY_CUERPO_DOCUMENTO, MISSING_DOCS_ASOCIADOS, TYPE_SPECIFIC_VIOLATION, etc.)
  - Zero constructor args — verified via test `ctorDeps === 0`

- **`MhDteConsultaService`** (`apps/api/src/modules/dte/services/mh-dte-consulta.service.ts`)
  - Public API: `verify(params: ConsultaParams): Promise<MhVerifyResult>`
  - Live HTTP POST to MH API (test or prod URL from existing `HACIENDA_URLS` constants)
  - Status map: VERIFIED / HARD_FAIL_NOT_FOUND / HARD_FAIL_MISMATCH / RETRY_TIMEOUT / RETRY_5XX / RETRY_AUTH / UNKNOWN_ERROR
  - Honors CLAUDE.md: no "Bearer " prefix in Authorization, `transformResponse: [raw => raw]` to read text first, `parseMhDate()` for fhProcesamiento
  - Default timeout 5000ms (configurable via `ConsultaParams.timeoutMs`)

### Zod schemas (11 per-type + base + dispatcher)

Location: `apps/api/src/modules/dte/schemas/received/`

- `base.zod.ts` — primitives (NIT, DUI, NRC, codigoGeneracion UUID, numeroControl regex, fecEmi ISO, horEmi) + composites (direccion, baseIdentificacion, baseEmisor, emisorSujetoExcluido, baseReceptor) + `decimalSchema` transformer
- `fe-01.zod.ts` — FE Factura Consumidor Final (IVA implicit, receptor nullable for anonymous)
- `ccfe-03.zod.ts` — CCFE Crédito Fiscal (ivaItem per line + cross-field invariant sum ≈ totalIva ± $0.01)
- `nre-04.zod.ts` — NRE Nota de Remisión (lenient resumen with passthrough)
- `nce-05.zod.ts` — NCE Nota de Crédito (docsAsociados.min(1) required)
- `nde-06.zod.ts` — NDE Nota de Débito (mirror of NCE, literal '06')
- `cre-07.zod.ts` — CRE Comprobante de Retención (optional cuerpoDocumento)
- `cle-08.zod.ts` — CLE Comprobante de Liquidación (lenient passthrough on emisor/receptor/body/resumen)
- `dcle-09.zod.ts` — DCLE Doc Contable de Liquidación (mirror of CLE, literal '09')
- `fexe-11.zod.ts` — FEXE Factura de Exportación (custom `fexeReceptorSchema` for foreign buyers, otrosDocumentos support)
- `fsee-14.zod.ts` — FSEE Factura Sujeto Excluido (uses `sujetoExcluido` block with tipoDocumento+numDocumento instead of `emisor.nit`)
- `cde-15.zod.ts` — CDE Comprobante de Donación (no IVA, valorUni + precioUni both optional)
- `index.ts` — `getSchemaForTipo(tipoDte)` dispatcher + `DTE_SCHEMAS_BY_TIPO` map + re-exports

### Fixtures (11 happy-path JSON files)

Location: `apps/api/src/modules/dte/__fixtures__/received/valid-*.json`

One per DTE type with plausible values matching MH JSON spec shape. Used by the per-type spec tests AND by the orchestrator parser spec tests (one happy-path assertion per type).

### Util extraction

- **`parseMhDate`** moved from private method in `DteLifecycleService` to pure util at `apps/api/src/common/utils/parse-mh-date.ts`
- **Behavior correction:** returns `null` on unparseable input (was: silently `new Date()` — masked bad data). Callers updated in `DteLifecycleService` (at lines ~216 and ~465). `fechaRecepcion` column is `DateTime?` (nullable), so no fallback needed at callsite.
- Dedicated unit test suite (8 tests) covering null/undefined/empty/valid MH format/ISO fallback/unparseable cases.

### Dependency added

- `nock@^13.5.6` as devDependency for MH API mocking in Nock tests

### Module registration

- `DteImportParserService` + `MhDteConsultaService` registered in `DteModule` (providers + exports); `HttpModule` added to imports for `MhDteConsultaService`.

---

## Tests — all green

| Suite | Tests |
|---|---|
| `parse-mh-date.spec.ts` | 8 |
| `base.zod.spec.ts` | 7 |
| `ccfe-03.zod.spec.ts` | 6 |
| `fe-01.zod.spec.ts` | 4 |
| `fsee-14.zod.spec.ts` | 4 |
| `nce-05.zod.spec.ts` | 4 |
| `nde-06.zod.spec.ts` | 4 |
| `nre-04.zod.spec.ts` | 2 |
| `fexe-11.zod.spec.ts` | 2 |
| `cde-15.zod.spec.ts` | 2 |
| `cre-07.zod.spec.ts` | 2 |
| `cle-08.zod.spec.ts` | 2 |
| `dcle-09.zod.spec.ts` | 2 |
| `index.spec.ts` (dispatcher) | 2 |
| `dte-import-parser.service.spec.ts` | 25 |
| `mh-dte-consulta.service.spec.ts` | 8 |
| **TOTAL Fase 1.3 new tests** | **82** |

Full DTE module: 113/113 pass (18 passing suites).

One pre-existing suite (`dte.service.spec.ts`) fails on a TypeScript type mismatch in `test-fixtures.ts` around `isCustomer: boolean | undefined` vs `boolean` — **verified pre-existing** on main via `git stash` check during Task 3. Zero regression caused by Fase 1.3.

---

## Not included (deferred, noted in spec §1 and §8)

- Orchestrator `DteImportService` (parse + verify + persist) → Fase 1.4
- Persistence to `ReceivedDTE` table → Fase 1.4 (requires Fase 1.2 merged)
- Background retry job for RETRY_TIMEOUT / RETRY_5XX → Fase 1.4-1.5
- Controller / HTTP upload endpoint → Fase 2 (frontend)
- OCR / PDF → JSON conversion → Fase 2
- Purchase creation from `ParsedDTE` → Fase 1.4

---

## Commits

```
675efa4 feat(dte): register import parser + MH consulta services in module
d9d3cfa feat(dte): add MhDteConsultaService with live verification + retry codes
b61f20e feat(dte): add DteImportParserService with type-aware validation
213792f feat(dte): add schemas dispatcher for received DTE types
14ebc49 feat(dte): add CRE/CLE/DCLE Zod schemas with lenient validation
54366a2 feat(dte): add NRE/FEXE/CDE Zod schemas with lenient validation
82ec1f3 feat(dte): add NCE (05) and NDE (06) Zod schemas with docsAsociados
bef0c12 feat(dte): add FE (01) and FSEE (14) Zod schemas
ee7f51e feat(dte): add CCFE (03) Zod schema with IVA validation
9400338 feat(dte): add base Zod schemas for received DTE validation
c44e97e refactor(dte): extract parseMhDate to shared util with null semantics
90e1506 chore(deps): add nock devDep for MH API mocking in tests
```

---

## Open decisions (unchanged from spec §8)

- O1: retry intervals for RETRY_TIMEOUT/5XX — resolves in Fase 1.4 (background job)
- O2: raw JSON storage (full vs hash-dedupe) — Fase 1.4
- O3: ingesta de DTE sin selloRecepcion (contingencia) — Fase 1.4 UX
- O4: verificación firma electrónica emisor — Fase 1.5+
- O5: verificación cruzada contra catálogos MH — best-effort Fase 1.3 (implicit in Zod enums), more in Fase 1.4

---

## Next

- **José action:** review branch + push + open PR (same pattern as Fase 1.2 / PR #89).
- **Next plan:** Fase 1.4 — orchestrator + persistence, requires Fase 1.2 merged (for `ReceivedDTE` + `Purchase` tables).
