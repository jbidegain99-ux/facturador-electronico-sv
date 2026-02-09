import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteService } from '../../dte/dte.service';
import { RecurringInvoicesService } from '../recurring-invoices.service';

interface RecurringInvoiceJobData {
  templateId: string;
}

interface TemplateItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

@Processor('recurring-invoices')
export class RecurringInvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringInvoiceProcessor.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
    private recurringService: RecurringInvoicesService,
  ) {
    super();
  }

  async process(job: Job<RecurringInvoiceJobData>): Promise<void> {
    const { templateId } = job.data;
    this.logger.log(`Processing recurring invoice template: ${templateId}`);

    try {
      const template = await this.prisma.recurringInvoiceTemplate.findUnique({
        where: { id: templateId },
        include: {
          cliente: true,
          tenant: true,
        },
      });

      if (!template) {
        this.logger.warn(`Template ${templateId} not found, skipping`);
        return;
      }

      if (template.status !== 'ACTIVE') {
        this.logger.warn(`Template ${templateId} is ${template.status}, skipping`);
        return;
      }

      // Parse items from JSON
      const items: TemplateItem[] = JSON.parse(template.items);

      // Build DTE body data matching the structure DteService.createDte expects
      const dteData = this.buildDteData(template, items);

      // Create the DTE
      const dte = await this.dteService.createDte(
        template.tenantId,
        template.tipoDte,
        dteData,
      );

      // If mode is AUTO_SEND and autoTransmit, sign and transmit
      if (template.mode === 'AUTO_SEND' && template.autoTransmit) {
        try {
          await this.dteService.signDte(dte.id);
          // Transmit needs nit and password from tenant config - skip if not available
          this.logger.log(`DTE ${dte.id} created and signed for template ${templateId}`);
        } catch (signError) {
          this.logger.warn(`DTE ${dte.id} created but signing failed: ${signError}`);
        }
      }

      await this.recurringService.recordSuccess(templateId, dte.id);
      this.logger.log(`Successfully processed template ${templateId}, DTE ${dte.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process template ${templateId}: ${errorMessage}`);
      await this.recurringService.recordFailure(templateId, errorMessage);
      throw error; // Let BullMQ handle retries
    }
  }

  private buildDteData(
    template: {
      tipoDte: string;
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
    },
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
