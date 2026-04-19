import { test } from '@playwright/test';

test.describe('Inventario UI', () => {
  test.skip('stock list con filtros + export XLSX', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('detalle con kardex — cambiar rango de fechas', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('dashboard widget click → /inventario?filter=below-reorder', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('crear ajuste MERMA desde /inventario/[id]', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('iniciar conteo físico + finalizar con diferencias', async () => {
    // TODO: unblock when staging env ready
  });
});
