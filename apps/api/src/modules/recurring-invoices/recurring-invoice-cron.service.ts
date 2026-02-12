import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { RecurringInvoicesService } from './recurring-invoices.service';

interface TemplateItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

interface TemplateForProcessing {
  id: string;
  tenantId: string;
  tipoDte: string;
  mode: string;
  autoTransmit: boolean;
  status: string;
  items: string;
  notas: string | null;
  cliente: {
    nombre: string;
    numDocumento: string;
    tipoDocumento: string;
    nrc: string | null;
    correo: string | null;
    telefono: string | null;
    direccion: string | null;
  };
  tenant: {
    nombre: string;
    nit: string;
    nrc: string;
    telefono: string;
    correo: string;
    direccion: string;
    actividadEcon: string;
  };
}

@Injectable()
export class RecurringInvoiceCronService {
  private readonly logger = new Logger(RecurringInvoiceCronService.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
    private recurringService: RecurringInvoicesService,
  ) {}

  /**
   * Runs daily at 00:01 AM El Salvador time.
   * Finds all ACTIVE templates with nextRunDate <= now and processes them directly.
   */
  @Cron('0 1 0 * * *', {
    name: 'processRecurringInvoices',
    timeZone: 'America/El_Salvador',
  })
  async handleRecurringInvoices(): Promise<void> {
    this.logger.log('Starting recurring invoices processing...');

    try {
      const dueTemplates = await this.recurringService.getDueTemplates();
      this.logger.log(`Found ${dueTemplates.length} due templates`);

      let successCount = 0;
      let failCount = 0;

      for (const template of dueTemplates) {
        try {
          await this.processTemplate(template.id);
          successCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to process template ${template.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Recurring invoices processing completed: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        'Fatal error in recurring invoices cron:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Process a single template: load it, generate a DTE, record result.
   * Uses atomic status transition to prevent duplicate execution.
   * Can be called from the cron job or manually via the trigger endpoint.
   */
  async processTemplate(templateId: string): Promise<{ dteId: string }> {
    this.logger.log(`Processing recurring invoice template: ${templateId}`);

    // Atomically claim the template by setting status to PROCESSING.
    // If another process already claimed it, updateMany returns count=0.
    const claimed = await this.prisma.recurringInvoiceTemplate.updateMany({
      where: {
        id: templateId,
        status: 'ACTIVE',
      },
      data: {
        status: 'PROCESSING',
      },
    });

    if (claimed.count === 0) {
      this.logger.warn(`Template ${templateId} could not be claimed (already processing or not active)`);
      throw new Error(`Template ${templateId} is not available for processing`);
    }

    const template = await this.prisma.recurringInvoiceTemplate.findUnique({
      where: { id: templateId },
      include: {
        cliente: true,
        tenant: true,
      },
    }) as TemplateForProcessing | null;

    if (!template) {
      this.logger.warn(`Template ${templateId} not found after claiming`);
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      const items: TemplateItem[] = JSON.parse(template.items);
      const dteData = this.buildDteData(template, items);

      const dte = await this.dteService.createDte(
        template.tenantId,
        template.tipoDte,
        dteData,
      );

      // If mode is AUTO_SEND and autoTransmit, sign the DTE
      if (template.mode === 'AUTO_SEND' && template.autoTransmit) {
        try {
          await this.dteService.signDte(dte.id);
          this.logger.log(`DTE ${dte.id} created and signed for template ${templateId}`);
        } catch (signError) {
          this.logger.warn(`DTE ${dte.id} created but signing failed: ${signError}`);
        }
      }

      await this.recurringService.recordSuccess(templateId, dte.id);
      this.logger.log(`Successfully processed template ${templateId}, DTE ${dte.id}`);

      return { dteId: dte.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process template ${templateId}: ${errorMessage}`);
      await this.recurringService.recordFailure(templateId, errorMessage);
      throw error;
    }
  }

  private buildDteData(
    template: TemplateForProcessing,
    items: TemplateItem[],
  ): Record<string, unknown> {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0];

    // Calculate totals
    let totalGravada = 0;
    const cuerpoDocumento = items.map((item, index) => {
      const ventaGravada = item.cantidad * item.precioUnitario - item.descuento;
      totalGravada += ventaGravada;
      return {
        numItem: index + 1,
        tipoItem: 1,
        cantidad: item.cantidad,
        codigo: null,
        descripcion: item.descripcion,
        precioUni: item.precioUnitario,
        montoDescu: item.descuento,
        ventaGravada,
        noGravado: 0,
      };
    });

    const ivaRate = 0.13;
    const totalIva = Math.round(totalGravada * ivaRate * 100) / 100;
    const totalPagar = Math.round((totalGravada + totalIva) * 100) / 100;

    // Parse stored address or use empty
    let direccion: Record<string, unknown> = {};
    try {
      direccion = template.cliente.direccion ? JSON.parse(template.cliente.direccion) : {};
    } catch {
      direccion = {};
    }

    return {
      identificacion: {
        version: template.tipoDte === '01' ? 1 : 3,
        ambiente: '00',
        tipoDte: template.tipoDte,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi: fecha,
        horEmi: hora,
      },
      emisor: {
        nit: template.tenant.nit?.replace(/-/g, '') || '',
        nrc: template.tenant.nrc?.replace(/-/g, '') || '',
        nombre: template.tenant.nombre,
        codActividad: template.tenant.actividadEcon || '',
        descActividad: '',
        telefono: template.tenant.telefono?.replace(/-/g, '') || '',
        correo: template.tenant.correo || '',
        codEstableMH: '0000',
        codEstable: '0000',
        codPuntoVentaMH: '0000',
        codPuntoVenta: '0000',
        direccion: (() => { try { return JSON.parse(template.tenant.direccion); } catch { return {}; } })(),
      },
      receptor: {
        tipoDocumento: template.cliente.tipoDocumento,
        numDocumento: template.cliente.numDocumento?.replace(/-/g, '') || '',
        nombre: template.cliente.nombre,
        nrc: template.cliente.nrc?.replace(/-/g, '') || null,
        correo: template.cliente.correo || '',
        telefono: template.cliente.telefono?.replace(/-/g, '') || '',
        direccion,
      },
      cuerpoDocumento,
      resumen: {
        totalGravada,
        totalIva,
        subTotalVentas: totalGravada,
        totalPagar,
        totalLetras: '',
        condicionOperacion: 1,
      },
      ...(template.notas ? { extension: { observaciones: template.notas } } : {}),
    };
  }
}
