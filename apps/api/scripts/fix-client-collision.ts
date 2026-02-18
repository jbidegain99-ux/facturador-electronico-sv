/**
 * One-time cleanup script: Fix client collision caused by empty numDocumento.
 *
 * Problem: The unique constraint @@unique([tenantId, numDocumento]) on Cliente
 * caused all webhook customers without numDocumento to collide on ''.
 * The first client created ("Maria Garcia Test") got linked to every DTE.
 *
 * This script:
 * 1. Finds all Cliente records with empty numDocumento ('')
 * 2. For each DTE linked to those clients, reads jsonOriginal.receptor
 * 3. Creates/finds the correct client based on receptor data
 * 4. Re-links the DTE to the correct client
 * 5. Cleans up the stale empty-numDocumento client records (if no longer linked)
 *
 * Usage (from apps/api/):
 *   npx ts-node -r dotenv/config scripts/fix-client-collision.ts
 *
 * Dry-run (no changes):
 *   DRY_RUN=true npx ts-node -r dotenv/config scripts/fix-client-collision.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';

interface ReceptorData {
  nombre?: string;
  correo?: string;
  telefono?: string;
  numDocumento?: string;
  tipoDocumento?: string;
  nrc?: string;
  direccion?: Record<string, unknown>;
}

async function main() {
  console.log(`\n=== Fix Client Collision Script ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  // 1. Find all clients with empty numDocumento
  const emptyDocClients = await prisma.cliente.findMany({
    where: { numDocumento: '' },
    include: {
      dtes: {
        select: {
          id: true,
          jsonOriginal: true,
          codigoGeneracion: true,
        },
      },
    },
  });

  console.log(`Found ${emptyDocClients.length} client(s) with empty numDocumento:\n`);

  for (const client of emptyDocClients) {
    console.log(`  Client: id=${client.id}, nombre="${client.nombre}", tenant=${client.tenantId}`);
    console.log(`    Linked DTEs: ${client.dtes.length}`);

    let relinkedCount = 0;

    for (const dte of client.dtes) {
      // Parse jsonOriginal to get receptor data
      let receptor: ReceptorData | undefined;
      try {
        const parsed = typeof dte.jsonOriginal === 'string'
          ? JSON.parse(dte.jsonOriginal)
          : dte.jsonOriginal;
        receptor = parsed?.receptor as ReceptorData | undefined;
      } catch {
        console.log(`    [SKIP] DTE ${dte.id}: failed to parse jsonOriginal`);
        continue;
      }

      if (!receptor?.nombre) {
        console.log(`    [SKIP] DTE ${dte.id}: no receptor.nombre in jsonOriginal`);
        continue;
      }

      const receptorNombre = receptor.nombre;
      const receptorCorreo = receptor.correo || null;
      const receptorTelefono = receptor.telefono || null;
      const receptorNumDoc = receptor.numDocumento || '';
      const receptorTipoDoc = receptor.tipoDocumento || '13';

      // If this DTE's receptor matches the client it's already linked to, skip
      if (receptorNombre === client.nombre && receptorCorreo === client.correo) {
        console.log(`    [OK] DTE ${dte.id} (${dte.codigoGeneracion}): already matches "${receptorNombre}"`);
        continue;
      }

      console.log(`    [FIX] DTE ${dte.id} (${dte.codigoGeneracion}): receptor="${receptorNombre}" but linked to "${client.nombre}"`);

      if (!DRY_RUN) {
        // Find or create the correct client
        const hasRealDoc = receptorNumDoc.length > 0;
        let correctClient = await prisma.cliente.findFirst({
          where: {
            tenantId: client.tenantId,
            OR: [
              ...(hasRealDoc ? [{ numDocumento: receptorNumDoc }] : []),
              { nombre: receptorNombre },
            ],
          },
        });

        if (!correctClient) {
          const uniqueNumDoc = hasRealDoc
            ? receptorNumDoc
            : `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          correctClient = await prisma.cliente.create({
            data: {
              tenantId: client.tenantId,
              tipoDocumento: receptorTipoDoc,
              numDocumento: uniqueNumDoc,
              nombre: receptorNombre,
              correo: receptorCorreo,
              telefono: receptorTelefono,
              nrc: receptor.nrc || null,
              direccion: JSON.stringify(receptor.direccion || {}),
            },
          });
          console.log(`      Created new client: id=${correctClient.id}, nombre="${correctClient.nombre}"`);
        } else {
          console.log(`      Found existing client: id=${correctClient.id}, nombre="${correctClient.nombre}"`);
        }

        // Re-link the DTE
        await prisma.dTE.update({
          where: { id: dte.id },
          data: { clienteId: correctClient.id },
        });
        console.log(`      Re-linked DTE ${dte.id} -> client ${correctClient.id}`);
        relinkedCount++;
      } else {
        console.log(`      [DRY RUN] Would re-link to correct client for "${receptorNombre}"`);
        relinkedCount++;
      }
    }

    // Check if the stale client still has any DTEs linked
    if (!DRY_RUN && relinkedCount > 0) {
      const remainingDtes = await prisma.dTE.count({
        where: { clienteId: client.id },
      });

      if (remainingDtes === 0) {
        // Also check recurring templates
        const remainingTemplates = await prisma.recurringInvoiceTemplate.count({
          where: { clienteId: client.id },
        });

        if (remainingTemplates === 0) {
          await prisma.cliente.delete({ where: { id: client.id } });
          console.log(`    Deleted stale client: id=${client.id}, nombre="${client.nombre}"`);
        } else {
          console.log(`    Kept client ${client.id}: still has ${remainingTemplates} recurring template(s)`);
        }
      } else {
        console.log(`    Kept client ${client.id}: still has ${remainingDtes} DTE(s) correctly linked`);
      }
    }

    console.log('');
  }

  if (emptyDocClients.length === 0) {
    console.log('  No clients with empty numDocumento found. Nothing to fix.\n');
  }

  console.log('=== Done ===\n');
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
