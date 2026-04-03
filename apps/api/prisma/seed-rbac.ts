/**
 * RBAC Seed Script
 *
 * Seeds the Permission, RoleTemplate, and RoleTemplatePermission tables.
 * Idempotent: safe to run multiple times (upserts by unique keys).
 *
 * Usage: npx ts-node prisma/seed-rbac.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Permission Catalog ───────────────────────────────────────────────────────
const PERMISSIONS: { resource: string; action: string; name: string; category: string }[] = [
  // Facturación (DTE)
  { resource: 'dte', action: 'create', name: 'Crear DTE', category: 'Facturación' },
  { resource: 'dte', action: 'read', name: 'Ver DTEs', category: 'Facturación' },
  { resource: 'dte', action: 'update', name: 'Editar DTE', category: 'Facturación' },
  { resource: 'dte', action: 'void', name: 'Anular DTE', category: 'Facturación' },
  { resource: 'dte', action: 'transmit', name: 'Transmitir DTE', category: 'Facturación' },
  { resource: 'dte', action: 'export', name: 'Exportar DTEs', category: 'Facturación' },

  // Clientes
  { resource: 'client', action: 'create', name: 'Crear Cliente', category: 'Clientes' },
  { resource: 'client', action: 'read', name: 'Ver Clientes', category: 'Clientes' },
  { resource: 'client', action: 'update', name: 'Editar Cliente', category: 'Clientes' },
  { resource: 'client', action: 'delete', name: 'Eliminar Cliente', category: 'Clientes' },

  // Sucursales / Puntos de Venta
  { resource: 'branch', action: 'read', name: 'Ver Sucursales', category: 'Sucursales' },
  { resource: 'branch', action: 'update', name: 'Editar Sucursal', category: 'Sucursales' },
  { resource: 'pos', action: 'read', name: 'Ver Puntos de Venta', category: 'Sucursales' },
  { resource: 'pos', action: 'update', name: 'Editar Punto de Venta', category: 'Sucursales' },

  // Usuarios
  { resource: 'user', action: 'read', name: 'Ver Usuarios', category: 'Administración' },
  { resource: 'user', action: 'manage', name: 'Gestionar Usuarios', category: 'Administración' },

  // Roles y Permisos
  { resource: 'role', action: 'read', name: 'Ver Roles', category: 'Administración' },
  { resource: 'role', action: 'manage', name: 'Gestionar Roles', category: 'Administración' },

  // Reportes
  { resource: 'report', action: 'read', name: 'Ver Reportes', category: 'Reportes' },
  { resource: 'report', action: 'export', name: 'Exportar Reportes', category: 'Reportes' },

  // Contabilidad
  { resource: 'accounting', action: 'read', name: 'Ver Contabilidad', category: 'Contabilidad' },
  { resource: 'accounting', action: 'create', name: 'Crear Asientos', category: 'Contabilidad' },
  { resource: 'accounting', action: 'approve', name: 'Aprobar Asientos', category: 'Contabilidad' },

  // Configuración
  { resource: 'config', action: 'read', name: 'Ver Configuración', category: 'Configuración' },
  { resource: 'config', action: 'update', name: 'Editar Configuración', category: 'Configuración' },

  // Catálogo de Productos/Servicios
  { resource: 'catalog', action: 'read', name: 'Ver Catálogo', category: 'Catálogo' },
  { resource: 'catalog', action: 'manage', name: 'Gestionar Catálogo', category: 'Catálogo' },

  // Cotizaciones
  { resource: 'quote', action: 'create', name: 'Crear Cotización', category: 'Cotizaciones' },
  { resource: 'quote', action: 'read', name: 'Ver Cotizaciones', category: 'Cotizaciones' },
  { resource: 'quote', action: 'update', name: 'Editar Cotización', category: 'Cotizaciones' },
  { resource: 'quote', action: 'delete', name: 'Eliminar Cotización', category: 'Cotizaciones' },
  { resource: 'quote', action: 'send', name: 'Enviar Cotización', category: 'Cotizaciones' },

  // Webhooks
  { resource: 'webhook', action: 'read', name: 'Ver Webhooks', category: 'Integraciones' },
  { resource: 'webhook', action: 'manage', name: 'Gestionar Webhooks', category: 'Integraciones' },
];

// ─── Role Templates ───────────────────────────────────────────────────────────
// Permission codes use wildcard notation for readability, expanded below
const ROLE_TEMPLATES: {
  code: string;
  name: string;
  description: string;
  permissionPatterns: string[];
}[] = [
  {
    code: 'tenant_admin',
    name: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades del tenant',
    permissionPatterns: ['*'], // All permissions
  },
  {
    code: 'branch_manager',
    name: 'Gerente de Sucursal',
    description: 'Gestión de sucursal, facturación, clientes y reportes',
    permissionPatterns: [
      'dte:*', 'client:*', 'branch:read', 'pos:read', 'pos:update',
      'report:read', 'report:export', 'catalog:read', 'quote:*',
      'user:read',
    ],
  },
  {
    code: 'cashier',
    name: 'Cajero / Facturador',
    description: 'Crear y consultar facturas, ver clientes y catálogo',
    permissionPatterns: [
      'dte:create', 'dte:read', 'dte:transmit',
      'client:read', 'client:create',
      'catalog:read',
      'quote:create', 'quote:read',
    ],
  },
  {
    code: 'accountant',
    name: 'Contador',
    description: 'Contabilidad, reportes y consulta de facturación',
    permissionPatterns: [
      'dte:read', 'dte:export',
      'client:read',
      'report:*', 'accounting:*',
      'catalog:read',
    ],
  },
  {
    code: 'viewer',
    name: 'Solo Lectura',
    description: 'Consulta de información sin capacidad de modificar',
    permissionPatterns: [
      'dte:read', 'client:read', 'branch:read', 'pos:read',
      'report:read', 'catalog:read', 'quote:read',
      'accounting:read', 'config:read',
    ],
  },
];

/**
 * Expand wildcard patterns like "dte:*" into actual permission codes.
 */
function expandPatterns(patterns: string[], allCodes: string[]): string[] {
  const result = new Set<string>();
  for (const pattern of patterns) {
    if (pattern === '*') {
      allCodes.forEach((c) => result.add(c));
    } else if (pattern.endsWith(':*')) {
      const resource = pattern.slice(0, -2);
      allCodes.filter((c) => c.startsWith(`${resource}:`)).forEach((c) => result.add(c));
    } else {
      if (allCodes.includes(pattern)) {
        result.add(pattern);
      }
    }
  }
  return Array.from(result);
}

async function main() {
  console.log('Seeding RBAC tables...\n');

  // 1. Upsert all permissions
  const allCodes: string[] = [];
  const permissionMap = new Map<string, string>(); // code → id

  for (const p of PERMISSIONS) {
    const code = `${p.resource}:${p.action}`;
    allCodes.push(code);

    const perm = await prisma.permission.upsert({
      where: { code },
      create: { code, resource: p.resource, action: p.action, name: p.name, category: p.category },
      update: { name: p.name, category: p.category },
    });
    permissionMap.set(code, perm.id);
  }
  console.log(`  Permissions: ${permissionMap.size} upserted`);

  // 2. Upsert role templates
  for (const tmpl of ROLE_TEMPLATES) {
    const template = await prisma.roleTemplate.upsert({
      where: { code: tmpl.code },
      create: {
        code: tmpl.code,
        name: tmpl.name,
        description: tmpl.description,
        isSystem: true,
      },
      update: {
        name: tmpl.name,
        description: tmpl.description,
      },
    });

    // 3. Resolve and upsert template permissions
    const expandedCodes = expandPatterns(tmpl.permissionPatterns, allCodes);

    // Remove old permissions not in the new set
    await prisma.roleTemplatePermission.deleteMany({
      where: {
        templateId: template.id,
        permissionId: { notIn: expandedCodes.map((c) => permissionMap.get(c)!).filter(Boolean) },
      },
    });

    // Upsert current permissions
    for (const code of expandedCodes) {
      const permId = permissionMap.get(code);
      if (!permId) continue;

      await prisma.roleTemplatePermission.upsert({
        where: {
          templateId_permissionId: { templateId: template.id, permissionId: permId },
        },
        create: { templateId: template.id, permissionId: permId },
        update: {},
      });
    }

    console.log(`  Template "${tmpl.name}" (${tmpl.code}): ${expandedCodes.length} permissions`);
  }

  console.log('\nRBAC seed complete.');
}

main()
  .catch((e) => {
    console.error('RBAC seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
