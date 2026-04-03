import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = 'cmkwth4ie0001b3hld086ommq'; // Republicode

async function main() {
  console.log('Creating default sucursal for Republicode...');

  // Update tenant with default establishment codes
  await prisma.tenant.update({
    where: { id: TENANT_ID },
    data: {
      codEstableMH: 'M001',
      codPuntoVentaMH: 'P001',
    },
  });
  console.log('  ✓ Tenant updated with codEstableMH=M001, codPuntoVentaMH=P001');

  // Check if sucursal already exists
  const existing = await prisma.sucursal.findFirst({
    where: { tenantId: TENANT_ID },
  });

  if (existing) {
    console.log(`  ⊘ Sucursal already exists: ${existing.nombre} (${existing.id})`);
    return;
  }

  // Create default sucursal (Casa Matriz)
  const sucursal = await prisma.sucursal.create({
    data: {
      tenantId: TENANT_ID,
      nombre: 'Casa Matriz',
      codEstableMH: 'M001',
      codEstable: 'M001',
      tipoEstablecimiento: '02', // Casa Matriz
      direccion: 'Av Las Magnolias, Edificio Insigne 1410, San Salvador, El Salvador',
      departamento: '06',
      municipio: '24',
      telefono: '2557-0092',
      correo: 'sales@republicode.com',
      esPrincipal: true,
    },
  });
  console.log(`  ✓ Sucursal creada: ${sucursal.nombre} (${sucursal.id})`);

  // Create default punto de venta
  const pv = await prisma.puntoVenta.create({
    data: {
      sucursalId: sucursal.id,
      nombre: 'Punto de Venta Principal',
      codPuntoVentaMH: 'P001',
      codPuntoVenta: 'P001',
    },
  });
  console.log(`  ✓ Punto de venta creado: ${pv.nombre} (${pv.id})`);

  // Link existing DTEs to this sucursal
  const updated = await prisma.dTE.updateMany({
    where: { tenantId: TENANT_ID, sucursalId: null },
    data: { sucursalId: sucursal.id, puntoVentaId: pv.id },
  });
  console.log(`  ✓ ${updated.count} DTEs vinculados a sucursal principal`);

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
