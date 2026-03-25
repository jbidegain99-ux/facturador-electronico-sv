# Bug #18: Datos No Se Guardan al Dar Clic en 'Anterior'

**Fecha:** 2026-03-25
**Branch:** main

## Root Cause

**Combination of H1 + H3**: Each step component initializes form state with empty/default values and doesn't restore saved data from the backend, even though the backend DOES return it.

The architecture works like this:
1. User clicks "Anterior" -> `handleGoToStep()` calls `POST /onboarding/go-to-step`
2. Backend updates `currentStep`, returns full `OnboardingState` including all saved data
3. `formatOnboardingResponse()` strips passwords but keeps: `haciendaUser`, `testEnvironmentUrl`, `prodEnvironmentUrl`, `testCertExpiry`, `prodCertExpiry`
4. **BUT** the frontend `OnboardingState` TypeScript interface didn't declare these fields
5. **AND** step components didn't use them to initialize form state

## Relationship with Bug #17

Bug #17 (DTE types disappearing) was a specific case of this systemic problem. It was fixed in commit `54d7e34` by adding a `useEffect` that syncs from `selectedTypes` prop. Bug #18 is the same pattern applied to ALL other steps.

## Affected Components + Fixes

### 1. `OnboardingState` type (apps/web/src/types/onboarding.ts:90-98)
- **Problem**: Missing `haciendaUser`, `testEnvironmentUrl`, `prodEnvironmentUrl`, `testCertExpiry`, `prodCertExpiry` fields
- **Fix**: Added these fields to the interface so frontend can access backend-provided data

### 2. `HaciendaCredentialsStep` (apps/web/src/components/onboarding/steps/hacienda-credentials-step.tsx:41-44)
- **Problem**: `haciendaUser` always initialized as `''`, even though backend returns it
- **Fix**: Initialize from `data?.haciendaUser`, add `useEffect` to sync on navigation

### 3. `ApiCredentialsStep` (apps/web/src/components/onboarding/steps/generic-step.tsx:467-486)
- **Problem**: `environmentUrl` always initialized as `''`, no prop to receive saved URL
- **Fix**: Added `savedEnvironmentUrl` prop, initialize and sync from it

### 4. `CertificateStep` (apps/web/src/components/onboarding/steps/generic-step.tsx:47-75)
- **Problem**: `expiryDate` always initialized as `''`, previously entered date lost on navigation
- **Fix**: Added `savedCertExpiry` prop, initialize and sync from it

### 5. `HaciendaWizard` (apps/web/src/components/onboarding/hacienda-wizard.tsx:372-437)
- **Problem**: Not passing saved data props to Certificate and API credential steps
- **Fix**: Pass `savedCertExpiry` and `savedEnvironmentUrl` props from `data`

## What Can't Be Restored (By Design)

- **File uploads** (certificates): Binary files can't be re-displayed after upload. The green "Ya tiene un certificado configurado" alert + "Continuar sin cambios" button handles this correctly.
- **Passwords** (hacienda password, API password, cert password): The backend correctly strips these from responses (encrypted, should never be sent back). The green alert + "Continuar sin cambios" handles this.

## Backend Verification

Backend correctly persists all data. The `formatOnboardingResponse()` method (onboarding.service.ts:825-837) strips only the 5 password fields and returns everything else via `...safe` spread. No data loss on the backend side.

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/types/onboarding.ts` | Added 5 fields to `OnboardingState` interface |
| `apps/web/src/components/onboarding/steps/hacienda-credentials-step.tsx` | Pre-fill `haciendaUser` from saved data + useEffect sync |
| `apps/web/src/components/onboarding/steps/generic-step.tsx` | Added `savedEnvironmentUrl` and `savedCertExpiry` props with sync |
| `apps/web/src/components/onboarding/hacienda-wizard.tsx` | Pass new props to Certificate and API credential steps |
