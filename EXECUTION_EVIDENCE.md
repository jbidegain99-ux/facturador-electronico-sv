# Bug #19: Archivos Obligatorios No Se Muestran al Navegar Atrás

**Fecha:** 2026-03-25
**Branch:** main

## Root Cause

**H1 confirmed**: HTML file inputs cannot be pre-filled with saved files (browser security restriction). The component correctly handled the backend logic (`hasCertificate` + `skipUpload: true`), but the UX failed to communicate the saved state to the user.

The disconnect:
- `handleSubmit` already had `if (hasCertificate && !formData.certificate) → skipUpload: true` (no validation error)
- Button already said "Continuar sin cambios" when cert existed
- **BUT** the upload area showed empty "Seleccionar archivo..." with required asterisks `*`
- User saw empty fields and thought nothing was saved, even though clicking "Continuar sin cambios" would work

Same pattern affected `ApiCredentialsStep` (password field empty with `*` required indicator).

## Fix Applied

### CertificateStep (generic-step.tsx)

**Before:**
- Green alert at top: "Ya tiene un certificado configurado"
- Upload area: empty "Seleccionar archivo..." with `*` required
- Password: empty with `*` required
- No indication of saved data in the form area itself

**After:**
- Green Card with details: "Certificado configurado correctamente" + expiry date if available
- Upload section title changes to "Reemplazar Certificado (opcional)"
- File button shows: checkmark + "Certificado guardado — clic para reemplazar" (dashed border)
- Password placeholder: "Contraseña guardada — dejar vacío para mantener"
- Required asterisks `*` hidden when certificate exists
- Same pattern for both combined and separate upload modes

### ApiCredentialsStep (generic-step.tsx)

**Before:**
- Green alert: "Ya tiene credenciales configuradas"
- Password field: empty with `*` required
- No indication of saved URL

**After:**
- Green Card with details: "Credenciales API configuradas correctamente" + saved URL
- Card title changes to "Actualizar Credenciales (opcional)"
- Password placeholder: "Contraseña guardada — dejar vacío para mantener"
- Required asterisks hidden when credentials exist

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/onboarding/steps/generic-step.tsx` | CertificateStep + ApiCredentialsStep UX overhaul for saved state |

## Also Applies To

- Certificado de Producción (PROD_CERTIFICATE) — same `CertificateStep` component
- API Producción (API_CREDENTIALS_PROD) — same `ApiCredentialsStep` component
