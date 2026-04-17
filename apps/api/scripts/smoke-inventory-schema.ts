import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function smokeTest() {
  console.log('[1/7] Count inventory_states:', await prisma.inventoryState.count());
  console.log('[2/7] Count inventory_movements:', await prisma.inventoryMovement.count());
  console.log('[3/7] Count received_dtes:', await prisma.receivedDTE.count());
  console.log('[4/7] Count purchases:', await prisma.purchase.count());
  console.log('[5/7] Count purchase_line_items:', await prisma.purchaseLineItem.count());
  console.log('[6/7] Count physical_counts:', await prisma.physicalCount.count());
  console.log('[7/7] Count physical_count_details:', await prisma.physicalCountDetail.count());
  console.log('[OK] All 7 new tables exist in staging DB');
  await prisma.$disconnect();
}

smokeTest().catch((e) => {
  console.error('[FAIL]', e.message);
  process.exit(1);
});
