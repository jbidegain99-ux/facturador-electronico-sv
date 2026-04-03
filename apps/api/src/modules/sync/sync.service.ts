import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SyncInvoice {
  id: string;
  tipoDte: string;
  codigoGeneracion: string | null;
  numeroControl: string | null;
  estado: string;
  selloRecepcion: string | null;
  totalGravada: number;
  totalIva: number;
  totalPagar: number;
  createdAt: Date;
  receptorNombre: string | undefined;
  receptorDocumento: string | undefined;
}

export interface SyncCustomer {
  id: string;
  tipoDocumento: string | null;
  numDocumento: string | null;
  nombre: string;
  nrc: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncCatalogItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  type: string;
  basePrice: number;
  uniMedida: number | null;
  taxRate: number;
  isActive: boolean;
}

export interface SyncResponse {
  invoices: SyncInvoice[];
  customers: SyncCustomer[];
  catalogItems: SyncCatalogItem[];
  syncTimestamp: string;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async getChangesSince(tenantId: string, since: string | null): Promise<SyncResponse> {
    const sinceDate = since ? new Date(since) : new Date(0);
    const now = new Date();

    const [invoices, customers, catalogItems] = await Promise.all([
      this.prisma.dTE.findMany({
        where: {
          tenantId,
          createdAt: { gte: sinceDate },
        },
        select: {
          id: true,
          tipoDte: true,
          codigoGeneracion: true,
          numeroControl: true,
          estado: true,
          selloRecepcion: true,
          totalGravada: true,
          totalIva: true,
          totalPagar: true,
          createdAt: true,
          cliente: {
            select: { nombre: true, numDocumento: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      this.prisma.cliente.findMany({
        where: {
          tenantId,
          updatedAt: { gte: sinceDate },
        },
        select: {
          id: true,
          tipoDocumento: true,
          numDocumento: true,
          nombre: true,
          nrc: true,
          correo: true,
          telefono: true,
          direccion: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.catalogItem.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          type: true,
          basePrice: true,
          uniMedida: true,
          taxRate: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      invoices: invoices.map((inv) => ({
        ...inv,
        totalGravada: Number(inv.totalGravada),
        totalIva: Number(inv.totalIva),
        totalPagar: Number(inv.totalPagar),
        receptorNombre: inv.cliente?.nombre,
        receptorDocumento: inv.cliente?.numDocumento,
      })),
      customers,
      catalogItems: catalogItems.map((item) => ({
        ...item,
        basePrice: Number(item.basePrice),
        taxRate: Number(item.taxRate),
      })),
      syncTimestamp: now.toISOString(),
    };
  }
}
