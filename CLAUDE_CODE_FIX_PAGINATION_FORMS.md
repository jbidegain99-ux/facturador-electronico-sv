# Fix Pagination, Recurring Invoices Crash, and Form Validations

## Issue 1: Pagination Still Not Working on /clientes

### Problem
The /clientes page shows "Mostrando 354 de 354 registros" at the bottom but NO pagination controls (no page buttons, no next/prev). All 354 clients load on a single page. The "Mostrar 20" dropdown is visible but changing it doesn't paginate — it still shows all records.

### Root Cause Investigation
The API endpoint `GET /api/v1/clientes?page=1&limit=20&sortBy=createdAt` should return paginated data like:
```json
{
  "data": [...20 items...],
  "total": 354,
  "page": 1,
  "limit": 20,
  "totalPages": 18
}
```

But the page shows all 354 records, meaning either:
1. The API is returning all records ignoring pagination params
2. The frontend is not sending pagination params correctly
3. The totalPages is being calculated as 1, hiding pagination controls

### Debug Steps
1. First, test the API directly to see what it returns:
```bash
curl -s "https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1/clientes?page=1&limit=10" | head -c 500
```

2. Check `apps/web/src/app/(dashboard)/clientes/page.tsx`:
   - Find the fetch URL — is it sending page and limit params?
   - After the response, log: `console.log('API response:', { dataLength: items.length, total, totalPages, page, limit })`
   - Check if `totalPages` is calculated correctly

3. Check `apps/web/src/components/ui/pagination.tsx`:
   - After the previous fix, does it render page buttons when totalPages > 1?
   - Add `console.log('Pagination props:', { currentPage, totalPages, total })` to debug

### Fix Required
- Ensure the API call includes `?page=${page}&limit=${limit}` params
- Ensure the response's `totalPages` is correctly parsed (should be 18 for 354 records with limit=20)
- Ensure pagination controls (Previous/Next buttons, page numbers) render when totalPages > 1
- Ensure clicking page buttons updates the `page` state and triggers re-fetch
- Ensure "Mostrar X" dropdown updates `limit` state, resets page to 1, and triggers re-fetch

---

## Issue 2: Recurring Invoices Page — Form POST Crash

### Problem  
The /facturas/recurrentes page now shows a graceful error state ("El servicio de facturas recurrentes no esta disponible aun" with a Reintentar button) — this is CORRECT since the API doesn't have the endpoint yet.

However, when the user clicks "Nuevo Template" and fills out the form, submitting it shows a toast error "Cannot POST /api/v1/recurring-invoices". This is expected since the API endpoint doesn't exist yet.

### Fix Required
The "Nuevo Template" button and the creation form should be HIDDEN or DISABLED when the recurring invoices API is not available. Since the GET request already fails with 404:
1. On the /facturas/recurrentes page: Hide the "+ Nuevo Template" button when the service is unavailable (when fetchError is set)
2. On the /facturas/recurrentes/nuevo page: Add a check at the top — if GET /recurring-invoices returns 404, show a message "El servicio de facturas recurrentes no está disponible aún" and a back button, don't show the form

---

## Issue 3: Form Validations for Nuevo Cliente and All Forms

### Problem
The "Nuevo Cliente" modal form has NO field validations. Users can submit empty required fields or invalid data. All forms across the app need proper validation matching El Salvador's tax document requirements.

### Required Validations for Nuevo Cliente Modal

Find the component: likely `apps/web/src/components/facturas/nuevo-cliente-modal.tsx` or similar.

**Field validations to implement:**

1. **Tipo Documento** (select): Required — must select one (NIT, DUI, NRC, Pasaporte, Carnet de Residente)

2. **Numero Documento** (text): Required, with format validation per type:
   - NIT: Format `0614-XXXXXX-XXX-X` (14 digits with dashes) — validate pattern
   - DUI: Format `XXXXXXXX-X` (9 digits with dash) — validate pattern  
   - NRC: Numeric only, max 7 digits
   - Pasaporte: Alphanumeric, 6-15 characters
   - Carnet de Residente: Alphanumeric

3. **Nombre / Razon Social** (text): Required, min 3 characters, max 200 characters

4. **NRC** (text): Optional, but if provided must be numeric, max 7 digits with format validation

5. **Telefono** (text): Optional, but if provided: 8 digits for El Salvador numbers, format `XXXX-XXXX`

6. **Correo Electronico** (text): Optional, but if provided must be valid email format

7. **Direccion** (text): Optional, max 500 characters

### Validation UX:
- Show validation errors inline below each field in red text
- Disable "Crear Cliente" button until all required fields are valid
- Show error messages in Spanish:
  - "Este campo es requerido"
  - "Formato de NIT inválido (debe ser 0614-XXXXXX-XXX-X)"
  - "Formato de DUI inválido (debe ser XXXXXXXX-X)"
  - "El correo electrónico no es válido"
  - "El teléfono debe tener 8 dígitos"
  - "El nombre debe tener al menos 3 caracteres"

### Audit Other Forms
After implementing Nuevo Cliente validations, audit these forms for similar validation needs:
1. `apps/web/src/app/(dashboard)/facturas/nueva/page.tsx` — New invoice form
2. `apps/web/src/app/(auth)/register/page.tsx` — Registration form  
3. `apps/web/src/app/(auth)/login/page.tsx` — Login form
4. `apps/web/src/app/(dashboard)/configuracion/page.tsx` — Settings forms
5. Any other forms that accept user input

For each form found, ensure:
- Required fields are marked and validated
- Email fields have email format validation
- Document number fields (NIT, DUI) have format validation
- Submit button is disabled until form is valid
- Error messages are in Spanish

---

## Files to Investigate

1. `apps/web/src/app/(dashboard)/clientes/page.tsx` — Pagination logic
2. `apps/web/src/components/ui/pagination.tsx` — Pagination UI component
3. `apps/web/src/app/(dashboard)/facturas/recurrentes/page.tsx` — Hide "Nuevo Template" on error
4. `apps/web/src/app/(dashboard)/facturas/recurrentes/nuevo/page.tsx` — Disable form when API unavailable
5. `apps/web/src/components/facturas/nuevo-cliente-modal.tsx` or similar — Client form validations
6. All form components across the app

## Success Criteria

- ✅ /clientes shows pagination controls when there are more records than the page limit
- ✅ Clicking page buttons loads different pages of clients
- ✅ "Mostrar X" changes the page size and paginates correctly
- ✅ /facturas/recurrentes hides "Nuevo Template" button when service unavailable
- ✅ /facturas/recurrentes/nuevo shows unavailable message if API returns 404
- ✅ Nuevo Cliente form validates all fields before allowing submission
- ✅ Validation errors show inline in Spanish
- ✅ All other forms have appropriate validations
- ✅ Build passes with zero errors
- ✅ No console errors on any page

## Definition of Done
1. All 3 issues fixed
2. Build succeeds
3. Code committed  
4. List of all files changed with summary
