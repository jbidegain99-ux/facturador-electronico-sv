/**
 * Seed Script: System Invoice Templates
 *
 * Seeds the 3 base templates: clasica, moderna, compacta.
 * Idempotent: safe to run multiple times (findFirst + create/update).
 *
 * Usage: npx ts-node src/modules/invoice-templates/seed/system-templates.seed.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SYSTEM_TEMPLATES = [
  {
    slug: 'clasica',
    name: 'Clásica',
    description:
      'Estilo formal tradicional con header de color, tabla de ítems con bordes completos y totales a la derecha.',
    isDefault: true,
    templateFile: 'clasica.hbs',
    config: {
      colors: {
        primary: '#7C3AED',
        secondary: '#4C1D95',
        accent: '#A78BFA',
        background: '#FFFFFF',
        text: '#1F2937',
        textLight: '#6B7280',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      logo: { position: 'left', maxWidth: 180, maxHeight: 80 },
      sections: {
        header: { visible: true, order: 1 },
        emisor: { visible: true, order: 2 },
        receptor: { visible: true, order: 3 },
        items: { visible: true, order: 4 },
        resumen: { visible: true, order: 5 },
        observaciones: { visible: true, order: 6 },
        qrCode: { visible: true, order: 7 },
        selloRecepcion: { visible: true, order: 8 },
        footer: { visible: true, order: 9 },
      },
      pageSettings: {
        size: 'letter',
        margins: { top: 15, right: 15, bottom: 15, left: 15 },
      },
    },
  },
  {
    slug: 'moderna',
    name: 'Moderna',
    description:
      'Estilo minimalista con logo centrado, cards redondeadas para emisor/receptor y mucho espacio blanco.',
    isDefault: false,
    templateFile: 'moderna.hbs',
    config: {
      colors: {
        primary: '#2563EB',
        secondary: '#1D4ED8',
        accent: '#60A5FA',
        background: '#FFFFFF',
        text: '#1F2937',
        textLight: '#6B7280',
      },
      fonts: { heading: 'Montserrat', body: 'Open Sans' },
      logo: { position: 'center', maxWidth: 200, maxHeight: 80 },
      sections: {
        header: { visible: true, order: 1 },
        emisor: { visible: true, order: 2 },
        receptor: { visible: true, order: 3 },
        items: { visible: true, order: 4 },
        resumen: { visible: true, order: 5 },
        observaciones: { visible: true, order: 6 },
        qrCode: { visible: true, order: 7 },
        selloRecepcion: { visible: true, order: 8 },
        footer: { visible: true, order: 9 },
      },
      pageSettings: {
        size: 'letter',
        margins: { top: 18, right: 18, bottom: 18, left: 18 },
      },
    },
  },
  {
    slug: 'compacta',
    name: 'Compacta',
    description:
      'Optimizada para densidad de información. Fuente pequeña, padding reducido, QR compacto.',
    isDefault: false,
    templateFile: 'compacta.hbs',
    config: {
      colors: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#34D399',
        background: '#FFFFFF',
        text: '#1F2937',
        textLight: '#6B7280',
      },
      fonts: { heading: 'Roboto', body: 'Roboto' },
      logo: { position: 'left', maxWidth: 100, maxHeight: 40 },
      sections: {
        header: { visible: true, order: 1 },
        emisor: { visible: true, order: 2 },
        receptor: { visible: true, order: 3 },
        items: { visible: true, order: 4 },
        resumen: { visible: true, order: 5 },
        observaciones: { visible: true, order: 6 },
        qrCode: { visible: true, order: 7 },
        selloRecepcion: { visible: true, order: 8 },
        footer: { visible: true, order: 9 },
      },
      pageSettings: {
        size: 'letter',
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
      },
    },
  },
];

async function main() {
  console.log('Seeding system invoice templates...\n');

  const templatesDir = path.join(__dirname, '..', 'templates');

  for (const tmpl of SYSTEM_TEMPLATES) {
    const htmlPath = path.join(templatesDir, tmpl.templateFile);
    const htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
    const configJson = JSON.stringify(tmpl.config);

    // Find existing by slug + tenantId IS NULL (system template)
    const existing = await prisma.invoiceTemplate.findFirst({
      where: { slug: tmpl.slug, tenantId: null, isSystem: true },
    });

    if (existing) {
      await prisma.invoiceTemplate.update({
        where: { id: existing.id },
        data: {
          name: tmpl.name,
          description: tmpl.description,
          config: configJson,
          htmlTemplate,
          cssStyles: '',
          isDefault: tmpl.isDefault,
          version: { increment: 1 },
        },
      });
      console.log(`  Updated: "${tmpl.name}" (${tmpl.slug})`);
    } else {
      await prisma.invoiceTemplate.create({
        data: {
          tenantId: null,
          slug: tmpl.slug,
          name: tmpl.name,
          description: tmpl.description,
          isSystem: true,
          isDefault: tmpl.isDefault,
          isActive: true,
          config: configJson,
          htmlTemplate,
          cssStyles: '',
          dteType: null,
          version: 1,
        },
      });
      console.log(`  Created: "${tmpl.name}" (${tmpl.slug})`);
    }
  }

  console.log('\nSystem templates seed complete.');
}

main()
  .catch((e) => {
    console.error('Template seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
