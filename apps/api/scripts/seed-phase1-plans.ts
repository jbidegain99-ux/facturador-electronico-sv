/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-time seed script for Phase 1 pricing restructuring.
 * Run from apps/api/: npx ts-node --compiler-options '{"strict":false}' scripts/seed-phase1-plans.ts
 */
import { PrismaClient } from '@prisma/client';
import { PLAN_CONFIGS } from '../src/common/plan-features';

const prisma = new PrismaClient();

async function seed() {
  console.log('=== Phase 1 Plan Seed ===\n');

  const buildPlanData = (
    code: string,
    nombre: string,
    descripcion: string,
    orden: number,
    isDefault = false,
  ) => {
    const config = PLAN_CONFIGS[code as keyof typeof PLAN_CONFIGS];
    return {
      codigo: code,
      nombre,
      descripcion,
      maxDtesPerMonth: config.limits.dtes,
      maxUsers: config.limits.users,
      maxClientes: config.limits.customers,
      maxStorageMb: config.limits.storage === -1 ? -1 : config.limits.storage * 1024,
      maxBranches: config.limits.branches,
      maxCatalogItems: config.limits.catalog,
      features: JSON.stringify(
        Object.entries(config.features)
          .filter(([, v]) => v)
          .map(([k]) => k),
      ),
      precioMensual: config.price.monthly,
      precioAnual: config.price.yearly,
      orden,
      isDefault,
    };
  };

  // 1. Upsert plans
  const plans = [
    buildPlanData('FREE', 'Free', 'Plan gratuito para probar la plataforma', 0),
    buildPlanData('STARTER', 'Starter', 'Perfecto para pequenas empresas comenzando con facturacion electronica', 1, true),
    buildPlanData('PROFESSIONAL', 'Professional', 'Para empresas en crecimiento que necesitan herramientas avanzadas', 2),
    buildPlanData('ENTERPRISE', 'Enterprise', 'Solucion completa sin limites para grandes organizaciones', 3),
  ];

  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { codigo: p.codigo },
      create: p,
      update: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        maxDtesPerMonth: p.maxDtesPerMonth,
        maxUsers: p.maxUsers,
        maxClientes: p.maxClientes,
        maxStorageMb: p.maxStorageMb,
        maxBranches: p.maxBranches,
        maxCatalogItems: p.maxCatalogItems,
        features: p.features,
        precioMensual: p.precioMensual,
        precioAnual: p.precioAnual,
        orden: p.orden,
        isDefault: p.isDefault,
      },
    });
    console.log(`Plan upserted: ${plan.codigo} - $${plan.precioMensual}/mo, branches: ${plan.maxBranches}, catalog: ${plan.maxCatalogItems}`);
  }

  // 2. Upsert PlanSupportConfig
  const supportConfigs = [
    { planCode: 'FREE', ticketSupportEnabled: true, ticketResponseHours: 0, resolutionSLAHours: 0, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'BAJA' },
    { planCode: 'STARTER', ticketSupportEnabled: true, ticketResponseHours: 24, resolutionSLAHours: 48, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'NORMAL' },
    { planCode: 'PROFESSIONAL', ticketSupportEnabled: true, ticketResponseHours: 12, resolutionSLAHours: 24, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'ALTA' },
    { planCode: 'ENTERPRISE', ticketSupportEnabled: true, ticketResponseHours: 2, resolutionSLAHours: 8, phoneSupportEnabled: true, phoneSupportHours: 'Lun-Vie 8am-6pm CST', accountManagerEnabled: true, hasLiveChat: true, chatSchedule: 'Lun-Vie 8am-8pm CST, Sab 10am-2pm', priority: 'CRITICA' },
  ];

  for (const sc of supportConfigs) {
    await prisma.planSupportConfig.upsert({
      where: { planCode: sc.planCode },
      create: sc,
      update: sc,
    });
    console.log(`SupportConfig: ${sc.planCode} - response: ${sc.ticketResponseHours}h, resolution: ${sc.resolutionSLAHours}h, priority: ${sc.priority}`);
  }

  // 3. Seed PlanFeature rows for FREE plan
  const freeFeatures = Object.entries(PLAN_CONFIGS.FREE.features);
  for (const [featureCode, enabled] of freeFeatures) {
    await prisma.planFeature.upsert({
      where: { planCode_featureCode: { planCode: 'FREE', featureCode } },
      create: { planCode: 'FREE', featureCode, enabled: enabled as boolean },
      update: { enabled: enabled as boolean },
    });
  }
  console.log(`\nFREE plan features seeded: ${freeFeatures.length} features`);

  // 4. Verify
  const allPlans = await prisma.plan.findMany({
    orderBy: { orden: 'asc' },
    select: { codigo: true, precioMensual: true, maxBranches: true, maxCatalogItems: true, maxDtesPerMonth: true },
  });
  console.log('\n=== Verification ===');
  console.log('Plans:', JSON.stringify(allPlans, null, 2));

  const tenantCount = await prisma.tenant.count();
  const ticketCount = await prisma.supportTicket.count();
  console.log(`\nData integrity: tenants=${tenantCount}, tickets=${ticketCount}`);
  console.log('\n=== Seed Complete ===');
}

seed()
  .catch((err) => {
    console.error('SEED FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
