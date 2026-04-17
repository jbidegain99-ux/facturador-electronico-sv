import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-end smoke test of the new inventory/purchase schema.
 * Uses the first tenant in DB, upserts a test supplier + catalog item,
 * creates a Purchase with line items, verifies readback via relation, cleans up.
 *
 * Adjusted from task template to match actual schema:
 *  - Cliente uses tipoDocumento + numDocumento (not nit), unique on [tenantId, numDocumento]
 *  - CatalogItem.tipoItem and uniMedida are Int (not String)
 *  - Purchase.supplier relation name is "CustomerPurchases"
 */
async function smoke() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant in DB — seed one first');
  const tenantId = tenant.id;
  console.log(`[setup] Using tenant: ${tenant.nombre} (${tenantId})`);

  // 1. Create/find a supplier (Cliente with isSupplier=true)
  const supplier = await prisma.cliente.upsert({
    where: { tenantId_numDocumento: { tenantId, numDocumento: '06141234567891' } },
    create: {
      tenantId,
      tipoDocumento: '36',
      numDocumento: '06141234567891',
      nrc: '1234567',
      nombre: 'Smoke Test Supplier SA de CV',
      direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'Test' }),
      telefono: '22001234',
      correo: 'smoke@test.com',
      isCustomer: false,
      isSupplier: true,
    },
    update: { isSupplier: true },
  });
  console.log(`[setup] Supplier: ${supplier.id}`);

  // 2. Create/find a catalog item (trackInventory=true)
  const item = await prisma.catalogItem.upsert({
    where: { tenantId_code: { tenantId, code: 'SMOKE-INV-001' } },
    create: {
      tenantId,
      code: 'SMOKE-INV-001',
      name: 'Smoke Item',
      type: 'PRODUCT',
      tipoItem: 1,
      uniMedida: 99,
      tributo: '20',
      basePrice: 10,
      costPrice: 7,
      taxRate: 13,
      trackInventory: true,
    },
    update: { trackInventory: true },
  });
  console.log(`[setup] Catalog item: ${item.id}`);

  // 3. Create a Purchase with one line item
  const purchaseNumber = `SMOKE-${Date.now()}`;
  const purchase = await prisma.purchase.create({
    data: {
      tenantId,
      purchaseNumber,
      supplierId: supplier.id,
      documentType: 'CCFE',
      documentNumber: '001-001-00-SMOKE',
      purchaseDate: new Date(),
      subtotal: '100.00',
      ivaAmount: '13.00',
      totalAmount: '113.00',
      status: 'DRAFT',
      createdBy: 'smoke-script',
      lineItems: {
        create: [
          {
            tenantId,
            lineNumber: 1,
            catalogItemId: item.id,
            description: 'Smoke line',
            quantity: '10.0000',
            unitPrice: '10.0000',
            taxCode: '20',
            taxAmount: '13.00',
            lineTotal: '100.00',
            qtyExpected: '10.0000',
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  if (purchase.lineItems.length !== 1) throw new Error('Expected 1 line item');
  console.log(`[OK] Created Purchase ${purchase.purchaseNumber} with ${purchase.lineItems.length} line`);

  // 4. Read back via supplier relation
  const viaSupplier = await prisma.cliente.findUnique({
    where: { id: supplier.id },
    include: { purchases: { where: { purchaseNumber } } },
  });
  if (viaSupplier?.purchases.length !== 1) throw new Error('Supplier relation broken');
  console.log('[OK] Purchase readable via Cliente.purchases relation');

  // 5. Cleanup
  await prisma.purchase.delete({ where: { id: purchase.id } });
  console.log('[OK] Cleanup successful');
  console.log('[OK] ALL GREEN — schema round-trip works');

  await prisma.$disconnect();
}

smoke().catch((e) => {
  console.error('[FAIL]', e);
  prisma.$disconnect();
  process.exit(1);
});
