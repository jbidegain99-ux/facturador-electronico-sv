import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportClienteItem } from './dto';

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  jobId: string;
  totalRows: number;
  processed: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private prisma: PrismaService) {}

  async importClientes(
    tenantId: string,
    clientes: ImportClienteItem[],
    fileName?: string,
  ): Promise<ImportResult> {
    // Create import job
    const job = await this.prisma.importJob.create({
      data: {
        tenantId,
        tipo: 'clientes',
        estado: 'PROCESANDO',
        totalRows: clientes.length,
        fileName: fileName || null,
      },
    });

    const errors: ImportError[] = [];
    let successful = 0;
    let processed = 0;

    for (let i = 0; i < clientes.length; i++) {
      const cliente = clientes[i];
      processed++;

      try {
        // Validate required fields
        if (!cliente.tipoDocumento) {
          errors.push({ row: i + 1, field: 'tipoDocumento', message: 'Campo requerido' });
          continue;
        }
        if (!cliente.numDocumento) {
          errors.push({ row: i + 1, field: 'numDocumento', message: 'Campo requerido' });
          continue;
        }
        if (!cliente.nombre) {
          errors.push({ row: i + 1, field: 'nombre', message: 'Campo requerido' });
          continue;
        }
        if (!cliente.direccion) {
          errors.push({ row: i + 1, field: 'direccion', message: 'Campo requerido' });
          continue;
        }

        // Upsert by numDocumento within tenant
        await this.prisma.cliente.upsert({
          where: {
            tenantId_numDocumento: {
              tenantId,
              numDocumento: cliente.numDocumento,
            },
          },
          create: {
            tenantId,
            tipoDocumento: cliente.tipoDocumento,
            numDocumento: cliente.numDocumento,
            nombre: cliente.nombre,
            nrc: cliente.nrc || null,
            correo: cliente.correo || null,
            telefono: cliente.telefono || null,
            direccion: cliente.direccion,
          },
          update: {
            tipoDocumento: cliente.tipoDocumento,
            nombre: cliente.nombre,
            nrc: cliente.nrc || null,
            correo: cliente.correo || null,
            telefono: cliente.telefono || null,
            direccion: cliente.direccion,
          },
        });

        successful++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        errors.push({ row: i + 1, field: 'general', message: errorMessage });
        this.logger.warn(`Error importing client row ${i + 1}: ${errorMessage}`);
      }
    }

    // Update job status
    const estado = errors.length === 0 ? 'COMPLETADO' : (successful > 0 ? 'COMPLETADO' : 'ERROR');
    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        estado,
        processed,
        successful,
        failed: errors.length,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    return {
      jobId: job.id,
      totalRows: clientes.length,
      processed,
      successful,
      failed: errors.length,
      errors,
    };
  }

  async getJobs(tenantId: string) {
    return this.prisma.importJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getJob(tenantId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job de importacion no encontrado');
    }

    return {
      ...job,
      errors: job.errors ? JSON.parse(job.errors) : [],
    };
  }
}
