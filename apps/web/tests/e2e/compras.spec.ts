import { test } from '@playwright/test';

// TODO: unblock when staging env ready. See EXECUTION_EVIDENCE_PHASE_2_2.md §Post-deploy runbook.
test.skip('Compras: happy path manual purchase entry', async ({ page }) => {
  // Navigate to /compras/nueva
  // Fill manual form: proveedor, número, fecha, concepto, monto
  // Submit and verify state transition to BORRADOR
  // Verify in compras list
});

// TODO: unblock when staging env ready. See EXECUTION_EVIDENCE_PHASE_2_2.md §Post-deploy runbook.
test.skip('Compras: import DTE from received DTEs', async ({ page }) => {
  // Navigate to /compras/nueva
  // Open ImportDteModal
  // Select a received DTE from grid
  // Verify autofill of proveedor, fecha, referenceCode
  // Submit and verify state transition to BORRADOR
});

// TODO: unblock when staging env ready. See EXECUTION_EVIDENCE_PHASE_2_2.md §Post-deploy runbook.
test.skip('Compras: anular with reception workflow constraint', async ({ page }) => {
  // Create a purchase in APROBADO state via API
  // Navigate to detail page
  // Verify "Anular" button is disabled/hidden (due to reception_required constraint)
  // Verify constraint message displays
});
