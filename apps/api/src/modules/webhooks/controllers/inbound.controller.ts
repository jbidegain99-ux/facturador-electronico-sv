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
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteService } from '../../dte/dte.service';
import * as crypto from 'crypto';

interface WellnestCustomerData {
  name: string;
  email: string;
  phone?: string;
  tipoDocumento?: string;
  numDocumento?: string;
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

interface InboundWebhookResponse {
  status: number;
  data: {
    dteId: string;
    codigoGeneracion: string;
    message: string;
  };
}

@ApiTags('Webhooks Inbound')
@Controller('webhooks/inbound')
export class InboundWebhooksController {
  private readonly logger = new Logger(InboundWebhooksController.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => DteService)) private dteService: DteService,
  ) {}

  /**
   * Inbound webhook endpoint for Wellnest Studio purchases.
   * Creates a DTE automatically from a package purchase.
   * Public endpoint (no JWT required) - secured via HMAC signature.
   */
  @Public()
  @Post('wellnest/:tenantId')
  @ApiOperation({ summary: 'Receive Wellnest purchase webhook and create DTE' })
  async handleWellnestPurchase(
    @Param('tenantId') tenantId: string,
    @Body() payload: WellnestPurchasePayload,
    @Headers('x-webhook-signature-256') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ): Promise<InboundWebhookResponse> {
    this.logger.log('=== WEBHOOK DEBUG START ===');
    this.logger.log(`Received Wellnest webhook for tenant ${tenantId}, purchaseId=${payload.purchaseId}`);
    this.logger.log(`Raw payload: ${JSON.stringify(payload, null, 2)}`);
    this.logger.log(`Customer data received: ${JSON.stringify(payload.customerData, null, 2)}`);
    this.logger.log(`customerData.name = "${payload.customerData?.name}"`);
    this.logger.log(`customerData.email = "${payload.customerData?.email}"`);
    this.logger.log(`customerData.phone = "${payload.customerData?.phone}"`);
    this.logger.log(`customerData.numDocumento = "${payload.customerData?.numDocumento}"`);
    this.logger.log('=== WEBHOOK DEBUG END ===');

    // 1. Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant no encontrado');
    }

    // 2. Validate required payload fields
    if (!payload.purchaseId || !payload.amount || !payload.customerData?.name) {
      throw new BadRequestException(
        'Payload incompleto: purchaseId, amount y customerData.name son requeridos',
      );
    }

    // 3. Verify HMAC signature if provided
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

    // 4. Check timestamp freshness (reject if older than 5 minutes)
    if (timestamp) {
      const timestampSec = parseInt(timestamp, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      const maxAge = 300; // 5 minutes
      if (Math.abs(nowSec - timestampSec) > maxAge) {
        throw new UnauthorizedException('Timestamp del webhook expirado');
      }
    }

    // 5. Idempotency check - prevent duplicate DTEs for the same purchase
    const existingDte = await this.prisma.dTE.findFirst({
      where: {
        tenantId,
        jsonOriginal: { contains: payload.purchaseId },
      },
    });

    if (existingDte) {
      this.logger.warn(`Duplicate webhook for purchaseId=${payload.purchaseId}, returning existing DTE`);
      return {
        status: HttpStatus.OK,
        data: {
          dteId: existingDte.id,
          codigoGeneracion: existingDte.codigoGeneracion,
          message: 'DTE ya existe para esta compra',
        },
      };
    }

    try {
      // 6. Build the DTE data structure expected by DteService.createDte()
      const discount = payload.discountApplied ?? 0;
      const ventaGravada = payload.amount - discount;
      const ivaRate = 0.13;
      const totalIva = Math.round(ventaGravada * ivaRate * 100) / 100;
      const totalPagar = Math.round((ventaGravada + totalIva) * 100) / 100;

      const now = new Date(payload.purchaseDate || Date.now());
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0];

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
        },
        receptor: {
          tipoDocumento: payload.customerData.tipoDocumento || '36',
          numDocumento: payload.customerData.numDocumento || '',
          nombre: payload.customerData.name,
          correo: payload.customerData.email,
          telefono: payload.customerData.phone?.replace(/-/g, '') || '',
          direccion: {},
        },
        cuerpoDocumento: [
          {
            numItem: 1,
            tipoItem: 2, // Servicio
            cantidad: 1,
            codigo: payload.packageId,
            descripcion: `Paquete de ${payload.creditsTotal} clases - Wellnest Studio`,
            precioUni: payload.amount,
            montoDescu: discount,
            ventaGravada,
            noGravado: 0,
          },
        ],
        resumen: {
          totalGravada: ventaGravada,
          totalIva,
          subTotalVentas: ventaGravada,
          totalPagar,
          totalLetras: '',
          condicionOperacion: 1, // Contado
        },
        extension: {
          observaciones: `Wellnest Purchase: ${payload.purchaseId} | Payment: ${payload.paymentMethod}`,
        },
      };

      // 7. Use DteService to create the DTE properly
      //    This handles: correlativo, numeroControl, client auto-creation, logging, webhook trigger
      this.logger.log(`=== DTE DATA BEING SENT TO createDte ===`);
      this.logger.log(`receptor.nombre = "${(dteData.receptor as Record<string, unknown>)?.nombre}"`);
      this.logger.log(`receptor.correo = "${(dteData.receptor as Record<string, unknown>)?.correo}"`);
      this.logger.log(`receptor.telefono = "${(dteData.receptor as Record<string, unknown>)?.telefono}"`);
      this.logger.log(`receptor.numDocumento = "${(dteData.receptor as Record<string, unknown>)?.numDocumento}"`);
      this.logger.log(`=== END DTE DATA ===`);
      const dte = await this.dteService.createDte(tenantId, '01', dteData);

      this.logger.log(
        `DTE created for Wellnest purchase ${payload.purchaseId}: id=${dte.id}, codigo=${dte.codigoGeneracion}`,
      );

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
        `Error processing Wellnest webhook for purchase ${payload.purchaseId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Verify HMAC-SHA256 signature using timing-safe comparison
   */
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
