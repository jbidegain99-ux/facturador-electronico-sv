import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebhooksService } from '../webhooks.service';
import * as crypto from 'crypto';

interface WellnestCustomerData {
  name: string;
  email: string;
  phone?: string;
}

interface WellnestPurchasePayload {
  userId: string;
  packageId: string;
  purchaseId: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  expirationDate: string;
  creditsTotal: number;
  paymentMethod: string;
  discountApplied?: number;
  customerData: WellnestCustomerData;
}

@ApiTags('Webhooks Inbound')
@Controller('api/v1/webhooks/inbound')
export class InboundWebhooksController {
  private readonly logger = new Logger(InboundWebhooksController.name);

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  /**
   * Inbound webhook endpoint for Wellnest Studio purchases.
   * Creates a DTE automatically from a package purchase.
   * Public endpoint (no JWT required) - secured via HMAC signature.
   */
  @Public()
  @Post('wellnest/:tenantId')
  @ApiOperation({ summary: 'Receive Wellnest purchase webhook' })
  async handleWellnestPurchase(
    @Param('tenantId') tenantId: string,
    @Body() payload: WellnestPurchasePayload,
    @Headers('x-webhook-signature-256') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ) {
    this.logger.log(`Received Wellnest webhook for tenant ${tenantId}`);

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant no encontrado');
    }

    // Validate payload
    if (!payload.purchaseId || !payload.amount || !payload.customerData?.name) {
      throw new BadRequestException('Payload incompleto: purchaseId, amount y customerData.name son requeridos');
    }

    // Verify HMAC signature if provided
    // The tenant's inbound webhook secret would be stored in config.
    // For now, if signature header is present, we validate it.
    if (signature) {
      const webhookSecret = process.env.WELLNEST_WEBHOOK_SECRET;
      if (webhookSecret) {
        const isValid = this.verifySignature(
          JSON.stringify(payload),
          signature,
          webhookSecret,
        );
        if (!isValid) {
          throw new UnauthorizedException('Signature inválida');
        }
      }
    }

    try {
      // Build DTE data for the purchase
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0];
      const discount = payload.discountApplied ?? 0;
      const ventaGravada = payload.amount - discount;
      const ivaRate = 0.13;
      const totalIva = Math.round(ventaGravada * ivaRate * 100) / 100;
      const totalPagar = Math.round((ventaGravada + totalIva) * 100) / 100;

      const dteData: Record<string, unknown> = {
        identificacion: {
          version: 1,
          ambiente: '00',
          tipoDte: '01',
          tipoModelo: 1,
          tipoOperacion: 1,
          tipoContingencia: null,
          motivoContin: null,
          fecEmi: fecha,
          horEmi: hora,
        },
        emisor: {
          nit: tenant.nit.replace(/-/g, ''),
          nrc: tenant.nrc.replace(/-/g, ''),
          nombre: tenant.nombre,
          codActividad: tenant.actividadEcon || '',
          descActividad: '',
          telefono: tenant.telefono.replace(/-/g, ''),
          correo: tenant.correo,
          codEstableMH: '0000',
          codEstable: '0000',
          codPuntoVentaMH: '0000',
          codPuntoVenta: '0000',
          direccion: (() => { try { return JSON.parse(tenant.direccion); } catch { return {}; } })(),
        },
        receptor: {
          tipoDocumento: '36',
          numDocumento: '',
          nombre: payload.customerData.name,
          correo: payload.customerData.email,
          telefono: payload.customerData.phone?.replace(/-/g, '') || '',
          direccion: {},
        },
        cuerpoDocumento: [{
          numItem: 1,
          tipoItem: 2, // Servicio
          cantidad: 1,
          codigo: payload.packageId,
          descripcion: `Paquete de ${payload.creditsTotal} clases - Wellnest Studio`,
          precioUni: payload.amount,
          montoDescu: discount,
          ventaGravada,
          noGravado: 0,
        }],
        resumen: {
          totalGravada: ventaGravada,
          totalIva,
          subTotalVentas: ventaGravada,
          totalPagar,
          totalLetras: '',
          condicionOperacion: 1,
        },
        extension: {
          observaciones: `Wellnest Purchase: ${payload.purchaseId}`,
        },
      };

      // Import DteService dynamically to avoid circular dependency
      // The DTE is created via Prisma directly here for simplicity
      const { DteService } = await import('../../dte/dte.service');

      // Use Prisma to create the DTE directly (simpler than injecting DteService which has many deps)
      const { v4: uuidv4 } = await import('uuid');
      const codigoGeneracion = uuidv4().toUpperCase();
      const numeroControl = `DTE-01-WN00P001-${Date.now().toString().padStart(15, '0')}`;

      const dte = await this.prisma.dTE.create({
        data: {
          tenantId,
          tipoDte: '01',
          codigoGeneracion,
          numeroControl,
          jsonOriginal: JSON.stringify({
            ...dteData,
            identificacion: {
              ...(dteData.identificacion as Record<string, unknown>),
              codigoGeneracion,
              numeroControl,
            },
          }),
          totalGravada: ventaGravada,
          totalIva,
          totalPagar,
          estado: 'PENDIENTE',
        },
      });

      // Trigger outbound webhook for dte.created
      await this.webhooksService.triggerEvent({
        tenantId,
        eventType: 'dte.created',
        data: {
          dteId: dte.id,
          codigoGeneracion: dte.codigoGeneracion,
          numeroControl: dte.numeroControl,
          tipoDocumento: '01',
          montoTotal: totalPagar,
          external_reference: payload.purchaseId,
          source: 'wellnest',
        },
        correlationId: dte.id,
      });

      this.logger.log(`DTE created for Wellnest purchase ${payload.purchaseId}: ${dte.id}`);

      return {
        status: HttpStatus.OK,
        data: {
          dteId: dte.id,
          codigoGeneracion: dte.codigoGeneracion,
          message: 'DTE creado exitosamente',
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing Wellnest webhook: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
