import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { TransmitterService } from '../transmitter/transmitter.service';
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
    private transmitterService: TransmitterService,
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

    const dte = await this.prisma.dTE.create({
      data: {
        tenantId,
        tipoDte,
        codigoGeneracion,
        numeroControl,
        jsonOriginal,
        totalGravada: 0,
        totalIva: 0,
        totalPagar: 0,
        estado: DTEStatus.PENDIENTE,
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

    const jsonFirmado = await this.signerService.signDocument(
      dte.tenant.id,
      JSON.stringify(dte.jsonOriginal),
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

  async transmitDte(dteId: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
      include: { tenant: true },
    });

    if (!dte || !dte.jsonFirmado) {
      throw new Error('DTE no encontrado o no firmado');
    }

    const result = await this.transmitterService.send(dte.tenant.id, dte.tipoDte, dte.jsonFirmado);

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        estado: result.estado === 'PROCESADO' ? DTEStatus.PROCESADO : DTEStatus.RECHAZADO,
        selloRecepcion: result.selloRecepcion,
        fechaRecepcion: result.fechaRecepcion ? new Date(result.fechaRecepcion) : null,
        codigoMh: result.codigoMh,
        descripcionMh: result.descripcionMh,
        intentosEnvio: { increment: 1 },
      },
    });

    await this.logDteAction(dteId, 'TRANSMITTED', { response: result });

    return updated;
  }

  async findByTenant(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.dTE.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true },
      }),
      this.prisma.dTE.count({ where: { tenantId } }),
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
        request: data,
      },
    });
  }
}
