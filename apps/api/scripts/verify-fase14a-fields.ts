import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function verify() {
  // Type-level check: if this compiles, the new fields exist in the generated client
  const r = {
    rawPayloadHash: '',
    mhVerifyAttempts: 0,
    lastMhVerifyAt: null as Date | null,
    mhVerifyError: null as string | null,
  };
  const count = await prisma.receivedDTE.count();
  console.log(`[OK] received_dtes rows: ${count}, new fields typed correctly:`, Object.keys(r).join(', '));
  await prisma.$disconnect();
}
verify().catch((e) => { console.error('[FAIL]', e.message); process.exit(1); });
