import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { sendDTE, SendDTERequest, MHReceptionError } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';
import { v4 as uuidv4 } from 'uuid';

// Enum mirror - will be replaced by Prisma generated types after prisma generate
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
  FIRMADO: 'FIRMADO',
  ENVIADO: 'ENVIADO',
  PROCESADO: 'PROCESADO',
  RECHAZADO: 'RECHAZADO',
  ANULADO: 'ANULADO',
} as const;

@Injectable()
export class DteService {
  private readonly logger = new Logger(DteService.name);

  constructor(
    private prisma: PrismaService,
    private signerService: SignerService,
    private mhAuthService: MhAuthService,
  ) {}

  async createDte(tenantId: string, tipoDte: string, data: Record<string, unknown>) {
    const codigoGeneracion = uuidv4().toUpperCase();
    const correlativo = await this.getNextCorrelativo(tenantId, tipoDte);
    const numeroControl = this.generateNumeroControl(tipoDte, correlativo);

    const jsonOriginal = {
      ...data,
      identificacion: {
        ...(data.identificacion as Record<string, unknown>),
        codigoGeneracion,
        numeroControl,
      },
    };

    // Extract totals from resumen
    const resumen = data.resumen as Record<string, unknown> | undefined;
    const totalGravada = Number(resumen?.totalGravada) || 0;
    const totalIva = Number(resumen?.totalIva) || 0;
    const totalPagar = Number(resumen?.totalPagar) || 0;

    // Try to find or create client based on receptor data
    let clienteId: string | undefined;
    const receptor = data.receptor as Record<string, unknown> | undefined;
    if (receptor?.nombre) {
      const existingCliente = await this.prisma.cliente.findFirst({
        where: {
          tenantId,
          OR: [
            { numDocumento: receptor.numDocumento as string },
            { nombre: receptor.nombre as string },
          ].filter(c => Object.values(c)[0]),
        },
      });

      if (existingCliente) {
        clienteId = existingCliente.id;
      } else {
        // Create new client from receptor data
        const newCliente = await this.prisma.cliente.create({
          data: {
            tenantId,
            tipoDocumento: (receptor.tipoDocumento as string) || '13',
            numDocumento: (receptor.numDocumento as string) || null,
            nombre: receptor.nombre as string,
            nrc: (receptor.nrc as string) || null,
            telefono: (receptor.telefono as string) || null,
            correo: (receptor.correo as string) || null,
            codActividad: (receptor.codActividad as string) || null,
            descActividad: (receptor.descActividad as string) || null,
          },
        });
        clienteId = newCliente.id;
      }
    }

    const dte = await this.prisma.dTE.create({
      data: {
        tenantId,
        tipoDte,
        codigoGeneracion,
        numeroControl,
        jsonOriginal,
        totalGravada,
        totalIva,
        totalPagar,
        estado: DTEStatus.PENDIENTE,
        ...(clienteId && { clienteId }),
      },
    });

    await this.logDteAction(dte.id, 'CREATED', { jsonOriginal });

    return dte;
  }

  async signDte(dteId: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new Error('DTE no encontrado');
    }

    if (!this.signerService.isCertificateLoaded()) {
      throw new Error('No certificate loaded for signing');
    }

    const jsonFirmado = await this.signerService.signDTE(
      dte.jsonOriginal as Record<string, unknown>,
    );

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        jsonFirmado,
        estado: DTEStatus.FIRMADO,
      },
    });

    await this.logDteAction(dteId, 'SIGNED', { jsonFirmado: jsonFirmado.substring(0, 100) + '...' });

    return updated;
  }

  async transmitDte(dteId: string, nit: string, password: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
      include: { tenant: true },
    });

    if (!dte || !dte.jsonFirmado) {
      throw new Error('DTE no encontrado o no firmado');
    }

    try {
      // Get auth token
      const env = (process.env.MH_API_ENV as 'test' | 'prod') || 'test';
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

      // Prepare request
      const identificacion = dte.jsonOriginal as { identificacion?: { ambiente?: string } };
      const ambiente = (identificacion?.identificacion?.ambiente || '00') as '00' | '01';

      const request: SendDTERequest = {
        ambiente,
        idEnvio: Date.now(),
        version: DTE_VERSIONS[dte.tipoDte as TipoDte],
        tipoDte: dte.tipoDte as TipoDte,
        documento: dte.jsonFirmado,
        codigoGeneracion: dte.codigoGeneracion,
      };

      // Send to MH
      const response = await sendDTE(tokenInfo.token, request, { env });

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: response.selloRecibido || undefined,
          fechaRecepcion: response.fhProcesamiento ? new Date(response.fhProcesamiento) : null,
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED', { response });

      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const observaciones = error instanceof MHReceptionError ? error.observaciones : undefined;

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.RECHAZADO,
          descripcionMh: observaciones?.join(', ') || errorMessage,
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMISSION_ERROR', { error: errorMessage, observaciones });

      throw error;
    }
  }

  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 20,
    filters?: { tipoDte?: string; estado?: string; search?: string },
  ) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters?.tipoDte) {
      where.tipoDte = filters.tipoDte;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.search) {
      where.OR = [
        { numeroControl: { contains: filters.search, mode: 'insensitive' } },
        { codigoGeneracion: { contains: filters.search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dTE.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true },
      }),
      this.prisma.dTE.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.dTE.findUnique({
      where: { id },
      include: { cliente: true, logs: true },
    });
  }

  private async getNextCorrelativo(tenantId: string, tipoDte: string): Promise<number> {
    const lastDte = await this.prisma.dTE.findFirst({
      where: { tenantId, tipoDte },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastDte) return 1;

    const match = lastDte.numeroControl.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) + 1 : 1;
  }

  private generateNumeroControl(tipoDte: string, correlativo: number): string {
    const establecimiento = 'M001P001'; // TODO: Get from tenant config
    return `DTE-${tipoDte}-${establecimiento}-${correlativo.toString().padStart(15, '0')}`;
  }

  private async logDteAction(dteId: string, accion: string, data: Record<string, unknown>) {
    await this.prisma.dTELog.create({
      data: {
        dteId,
        accion,
        request: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
