import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check existing Republicode tenant
  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [
        { nit: { contains: '0614180723' } },
        { nombre: { contains: 'Republicode' } },
        { nombre: { contains: 'republicode' } },
      ],
    },
    select: { id: true, nombre: true, nit: true, nrc: true, plan: true },
  });
  console.log('=== REPUBLICODE TENANT ===');
  console.log(JSON.stringify(tenants, null, 2));

  // Check existing clients for this tenant
  if (tenants.length > 0 && tenants[0]) {
    const tenantId = tenants[0].id;
    const clientCount = await prisma.cliente.count({ where: { tenantId } });
    const dteCount = await prisma.dTE.count({ where: { tenantId } });
    console.log(`\n=== EXISTING DATA for ${tenantId} ===`);
    console.log(`Clientes: ${clientCount}`);
    console.log(`DTEs: ${dteCount}`);

    const clients = await prisma.cliente.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, numDocumento: true },
    });
    console.log('\nClientes:', JSON.stringify(clients, null, 2));
  }

  // Check all tenants
  const allTenants = await prisma.tenant.findMany({
    select: { id: true, nombre: true, nit: true },
  });
  console.log('\n=== ALL TENANTS ===');
  console.log(JSON.stringify(allTenants, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
