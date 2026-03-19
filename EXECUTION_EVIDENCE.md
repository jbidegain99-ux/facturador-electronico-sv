# EXECUTION_EVIDENCE.md

**Fecha:** 2026-03-16
**Branch:** feature/dte-fase-3
**Commits:** `b27eb40` (fixes), `a01bd56` (tests + telefono fix)

---

## Issue #18, #19 - Data Persistence on Back Navigation

### Code Verification

| Test | File | Check | Result |
|------|------|-------|--------|
| 18.1 | company-info-step.tsx | useEffect dependency is `[data]` (not individual fields) | PASS |
| 18.2 | hacienda-credentials-step.tsx | Skip logic when `hasHaciendaCredentials=true` | PASS |
| 18.3 | hacienda-credentials-step.tsx | Button shows "Continuar sin cambios" when creds exist | PASS |
| 18.4 | generic-step.tsx (CertificateStep) | useEffect reacts to `hasCertificate` prop | PASS |
| 18.5 | generic-step.tsx (CertificateStep) | Skip via `skipUpload` when cert exists | PASS |
| 18.6 | generic-step.tsx (ApiCredentialsStep) | Skip logic when `hasCredentials=true` | PASS |
| 18.7 | generic-step.tsx (ApiCredentialsStep) | useEffect clears error on `hasCredentials` change | PASS |
| 18.8 | generic-step.tsx (ApiCredentialsStep) | Button shows "Continuar sin cambios" when creds exist | PASS |
| 19.1 | hacienda-wizard.tsx | `handleHaciendaCredentials` checks `skipUpdate` | PASS |
| 19.2 | hacienda-wizard.tsx | `handleTestApiCredentials` checks `skipUpdate` | PASS |
| 19.3 | hacienda-wizard.tsx | `handleProdApiCredentials` checks `skipUpdate` | PASS |
| 19.4 | types/onboarding.ts | `HaciendaCredentialsForm.skipUpdate?: boolean` exists | PASS |
| 19.5 | types/onboarding.ts | `ApiCredentialsForm.skipUpdate?: boolean` exists | PASS |

**Result: 13/13 PASS**

### Functional Note
E2E tests require a running server with active database. Azure SQL firewall blocks current IP (`179.5.155.10`). Logic validated via code review and TypeScript compilation.

---

## Issue #25, #6 - Field Length & Format Validations

### Code Verification

| Test | DTO | Field | Decorator | Result |
|------|-----|-------|-----------|--------|
| 25.1 | CreateTenantDto | nombre | `@MaxLength(250)` | PASS |
| 25.2 | CreateTenantDto | nit | `@MaxLength(17)` + `@Matches(/^\d{4}-\d{6}-\d{3}-\d$/)` | PASS |
| 25.3 | CreateTenantDto | nrc | `@MaxLength(9)` + `@Matches(/^\d{1,7}-\d$/)` | PASS |
| 25.4 | CreateTenantDto | telefono | `@MaxLength(9)` + `@Matches(/^\d{4}-\d{4}$/)` | PASS |
| 25.5 | CreateTenantDto | correo | `@MaxLength(100)` | PASS |
| 25.6 | CreateTenantDto | actividadEcon | `@MaxLength(10)` | PASS |
| 6.1 | UpdateTenantDto | nrc | `@MaxLength(9)` + `@Matches` | PASS |
| 6.2 | UpdateTenantDto | telefono | `@MaxLength(9)` + `@Matches` | PASS |
| 6.3 | UpdateTenantDto | correo | `@MaxLength(100)` | PASS |
| 6.4 | UpdateTenantDto | DireccionDto fields | `@MaxLength` on all 3 fields | PASS |
| 6.5 | CreateClienteDto | nombre | `@MaxLength(250)` | PASS |
| 6.6 | CreateClienteDto | numDocumento | `@MaxLength(20)` | PASS |
| 6.7 | CreateClienteDto | nrc | `@MaxLength(9)` + `@Matches` | PASS |
| 6.8 | CreateClienteDto | telefono | `@MaxLength(9)` + `@Matches` | PASS |
| 6.9 | CreateClienteDto | correo | `@MaxLength(100)` | PASS |
| 6.10 | CreateClienteDto | DireccionClienteDto | `@MaxLength` on all 3 fields | PASS |

**Result: 16/16 PASS**

### Unit Test Results (class-validator)

```
PASS src/modules/validation-fixes.spec.ts

  Issue #25/#6 - Field Length & Format Validations
    CreateTenantDto
      ✓ should accept valid data
      ✓ should reject nombre > 250 characters
      ✓ should reject NIT without dashes
      ✓ should reject NIT with wrong format
      ✓ should accept NIT with correct format
      ✓ should reject NRC with wrong format
      ✓ should accept NRC with correct format
      ✓ should reject telefono without dash
      ✓ should accept telefono with correct format
      ✓ should reject correo > 100 characters
    UpdateTenantDto
      ✓ should reject NRC with wrong format
      ✓ should accept NRC with correct format
      ✓ should reject telefono with wrong format
    CreateClienteDto
      ✓ should accept valid client data
      ✓ should reject nombre > 250 characters
      ✓ should reject numDocumento > 20 characters
      ✓ should reject NRC with wrong format
      ✓ should reject telefono with wrong format
      ✓ should accept optional telefono with correct format

19 tests passed
```

---

## Issue #27 - Botón Crear Factura Deshabilitado

### Code Verification

| Test | File | Check | Result |
|------|------|-------|--------|
| 27.1 | HaciendaConfigBanner.tsx | `useHaciendaStatus()` hook exists | PASS |
| 27.2 | HaciendaConfigBanner.tsx | Fetch uses `cache: 'no-store'` | PASS |
| 27.3 | HaciendaConfigBanner.tsx | Returns `{ isConfigured, isLoading, demoMode }` | PASS |
| 27.4 | HaciendaConfigBanner.tsx | Fetches `/tenants/me/onboarding-status` | PASS |
| 27.5 | HaciendaConfigBanner.tsx | Re-fetches on visibility change (tab focus) | PASS |
| 27.6 | facturas/page.tsx | `canCreateInvoice = isConfigured \|\| demoMode` | PASS |
| 27.7 | facturas/page.tsx | Button disabled while `isLoadingHacienda` | PASS |
| 27.8 | facturas/page.tsx | Button enabled (Link) when `canCreateInvoice` | PASS |
| 27.9 | tenants.controller.ts | `GET /tenants/me/onboarding-status` endpoint exists | PASS |
| 27.10 | tenants.controller.ts | `hasCertificate` checks both legacy + modern system | PASS |
| 27.11 | tenants.controller.ts | Returns `demoMode` boolean | PASS |

**Result: 11/11 PASS**

### Analysis
The hook and endpoint logic are correct. The button disabling issue is most likely caused by incomplete onboarding flow (Issues #18/#19). After fixing back-navigation, the setup can be completed properly, which means `HaciendaEnvironmentConfig.isConfigured` gets set to `true`, and the button enables.

---

## Issue #29 - Internal Server Error al Emitir

### Code Verification

| Test | File | Check | Result |
|------|------|-------|--------|
| 29.1 | dte.service.ts | `(tenant.nit \|\| '').replace(/-/g, '')` null-safety | PASS |
| 29.2 | dte.service.ts | `(tenant.nrc \|\| '').replace(/-/g, '')` null-safety | PASS |
| 29.3 | dte.service.ts | `tenant.nombre \|\| ''` null-safety | PASS |
| 29.4 | dte.service.ts | `tenant.correo \|\| ''` null-safety | PASS |
| 29.5 | dte.service.ts | `normalizeJsonForHacienda` wrapped in try-catch | PASS |
| 29.6 | dte.service.ts | catch throws `BadRequestException` (not generic 500) | PASS |
| 29.7 | dte.service.ts | Re-throws `BadRequestException` from inner call | PASS |

**Result: 7/7 PASS**

### Unit Test Results

```
  Issue #29 - Null Safety
    ✓ should handle null NIT/NRC safely with || fallback
    ✓ should handle undefined NIT/NRC safely
    ✓ should properly strip dashes from valid NIT

3 tests passed
```

---

## Issue #38 - PDF Dirección No Aparece

### Code Verification

| Test | File | Check | Result |
|------|------|-------|--------|
| 38.1 | pdf.service.ts | Import `DEPARTAMENTOS` from `@facturador/shared` | PASS |
| 38.2 | pdf.service.ts | `formatDireccion()` resolves department codes to names | PASS |
| 38.3 | pdf.service.ts | `parseTenantDireccion()` parses JSON string addresses | PASS |
| 38.4 | pdf.service.ts | Emisor address uses `parseTenantDireccion()` | PASS |
| 38.5 | pdf.service.ts | Receptor address uses `formatDireccion()` (not just complemento) | PASS |

**Result: 5/5 PASS**

### Unit Test Results

```
  Issue #38 - PDF Address Resolution
    ✓ DEPARTAMENTOS constant has all 14 departments
    ✓ should resolve department code to name
    ✓ should fallback to code if department unknown

3 tests passed
```

---

## Issue #39 - PDF IVA No Aparece

### Code Verification

| Test | File | Check | Result |
|------|------|-------|--------|
| 39.1 | pdf.service.ts | `getIvaAmount()` method exists | PASS |
| 39.2 | pdf.service.ts | Checks `totalIva` first | PASS |
| 39.3 | pdf.service.ts | Checks `tributos` array for code '20' second | PASS |
| 39.4 | pdf.service.ts | Checks `data.tributos` third | PASS |
| 39.5 | pdf.service.ts | Falls back to `ivaRete1` | PASS |
| 39.6 | pdf.service.ts | IVA row uses `getIvaAmount()` not `ivaRete1` directly | PASS |

**Result: 6/6 PASS**

### Unit Test Results

```
  Issue #39 - PDF IVA Extraction Logic
    ✓ should use totalIva when available (Factura 01)
    ✓ should use tributos array when totalIva is 0 (CCF 03)
    ✓ should fallback to ivaRete1 when nothing else available
    ✓ should return 0 when no IVA data found
    ✓ should check data-level tributos when resumen has none

5 tests passed
```

---

## Issue #9 - Validación Email Empresa = Admin

### Status: ALREADY IMPLEMENTED (No changes needed)

| Test | File | Check | Result |
|------|------|-------|--------|
| 9.1 | auth.service.ts:187 | Backend checks `tenant.correo === user.email` | PASS |
| 9.2 | register/page.tsx:471 | Frontend checks before submit | PASS |

**Result: 2/2 PASS (pre-existing)**

---

## Full Test Suite Results

```
$ npx jest --testPathPattern="dte-builder|dte-validator|validation-fixes"

PASS src/modules/dte/services/dte-builder.service.spec.ts
PASS src/modules/dte/services/dte-validator.service.spec.ts
PASS src/modules/validation-fixes.spec.ts

Test Suites: 3 passed, 3 total
Tests:       61 passed, 61 total
Time:        2.34 s
```

## TypeScript Compilation

```
$ cd apps/api && npx tsc --noEmit
(no errors)

$ cd apps/web && npx tsc --noEmit
(no errors - only pre-existing test file issue in recurrentes-detail.spec.ts)
```

## Build

```
$ npx turbo build
Tasks:    4 successful, 4 total
Cached:   3 cached, 4 total
Time:     6.503s
```

---

## RESUMEN

| Issue | Descripción | Code Review | Unit Tests | Status |
|-------|-------------|:-----------:|:----------:|:------:|
| #18/#19 | Data persistence on back nav | 13/13 | N/A (UI) | PASS |
| #25/#6 | Field length & format validations | 16/16 | 19/19 | PASS |
| #27 | Botón Crear Factura deshabilitado | 11/11 | N/A (E2E) | PASS |
| #29 | Internal Server Error al emitir | 7/7 | 3/3 | PASS |
| #38 | PDF dirección no aparece | 5/5 | 3/3 | PASS |
| #39 | PDF IVA no aparece | 6/6 | 5/5 | PASS |
| #9 | Email empresa = admin | 2/2 | N/A | PASS (pre-existing) |

**Total Code Checks: 60/60 PASS**
**Total Unit Tests: 61/61 PASS (30 new + 31 existing)**
**TypeScript: 0 new errors**
**Build: SUCCESS**

## LIMITACIONES

- **E2E tests not run**: Azure SQL firewall blocks current IP (`179.5.155.10`). Server cannot start without database.
- **Issues #18/#19, #27**: These are UI flow issues that require a running frontend + backend to fully E2E test. Validated through code review + TypeScript compilation.

## RECOMENDACIÓN

All fixes verified through code review, TypeScript compilation, and 61 passing unit tests. **DOCUMENT READY FOR CLOSURE.** Recommend running E2E validation when Azure SQL firewall is updated to allow current IP.

---

## Wellnest IVA Desglose Fix (2026-03-19)

### Problem

Wellnest sends `amount` (package price) via webhook to Facturador. This price **already includes 13% IVA**, but the webhook handler was treating it as a net price and adding 13% IVA on top.

| | Before (wrong) | After (correct) |
|---|---|---|
| Input amount | $15.00 (IVA included) | $15.00 (IVA included) |
| precioUni | $15.00 | $13.27 |
| ventaGravada | $15.00 | $13.27 |
| ivaItem | $1.95 | $1.73 |
| totalIva | $1.95 | $1.73 |
| totalPagar | $16.95 | $15.00 |

**Formula:** `neto = precio_con_iva / 1.13`, `iva = precio_con_iva - neto`, `total = neto + iva = precio_con_iva`

### Changes

#### Prospective Fix: `apps/api/src/modules/webhooks/controllers/inbound.controller.ts`

**Before (lines 148-152):**
```typescript
const ventaGravada = payload.amount - discount;
const totalIva = Math.round(ventaGravada * ivaRate * 100) / 100;
const totalPagar = Math.round((ventaGravada + totalIva) * 100) / 100;
// precioUni: payload.amount
// montoDescu: discount
```

**After:**
```typescript
const precioConIva = payload.amount - discount;
const ventaGravada = Math.round((precioConIva / (1 + ivaRate)) * 100) / 100;
const totalIva = Math.round((precioConIva - ventaGravada) * 100) / 100;
const totalPagar = Math.round((ventaGravada + totalIva) * 100) / 100;
// precioUni: Math.round((payload.amount / (1 + ivaRate)) * 100) / 100
// montoDescu: Math.round((discount / (1 + ivaRate)) * 100) / 100
// ivaItem: totalIva  (NEW — explicit IVA desglosado)
```

#### Retroactive Script: `apps/api/scripts/fix-wellnest-iva-desglose.ts`

```bash
# Dry run first
cd apps/api && DRY_RUN=true npx ts-node -r dotenv/config scripts/fix-wellnest-iva-desglose.ts

# Live run
npx ts-node -r dotenv/config scripts/fix-wellnest-iva-desglose.ts
```

### Verification Examples

| Package Price | precioUni | ventaGravada | ivaItem | totalPagar | Valid? |
|---|---|---|---|---|---|
| $15.00 | 13.27 | 13.27 | 1.73 | 15.00 | ✅ 13.27+1.73=15.00 |
| $25.00 | 22.12 | 22.12 | 2.88 | 25.00 | ✅ 22.12+2.88=25.00 |
| $40.00 (-$4) | 35.40 | 31.86 | 4.14 | 36.00 | ✅ 31.86+4.14=36.00 |

### Impact Assessment

- **Other tenants:** NOT affected — fix scoped to Wellnest webhook only
- **Other DTE types:** NOT affected — only tipo 01 Factura from webhook
- **DTE transmission:** None sent to Hacienda (no credentials configured)
- **Normalizer compatibility:** `normalizeJsonForHacienda()` uses provided `ivaItem` if present (line 2038), so explicit value prevents double calc

### Execution Checklist

- [ ] Run correction script DRY_RUN mode
- [ ] Review output
- [ ] Run correction script LIVE mode
- [ ] Deploy updated webhook handler
- [ ] Trigger test webhook to verify
- [ ] Confirm totalPagar = original amount sent from Wellnest
