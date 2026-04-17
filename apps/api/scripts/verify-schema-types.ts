import { PrismaClient } from '@prisma/client';
import type { Purchase, PurchaseLineItem, InventoryState, InventoryMovement, ReceivedDTE, PhysicalCount, PhysicalCountDetail } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTypes() {
  // Type-only test: si compila, los modelos están en el client
  const check: {
    purchase: Purchase | null;
    purchaseLine: PurchaseLineItem | null;
    invState: InventoryState | null;
    invMov: InventoryMovement | null;
    receivedDte: ReceivedDTE | null;
    physCount: PhysicalCount | null;
    physDetail: PhysicalCountDetail | null;
  } = {
    purchase: null,
    purchaseLine: null,
    invState: null,
    invMov: null,
    receivedDte: null,
    physCount: null,
    physDetail: null,
  };

  console.log('[OK] All new Prisma models compile:', Object.keys(check).join(', '));
  await prisma.$disconnect();
}

verifyTypes().catch((e) => {
  console.error(e);
  process.exit(1);
});
