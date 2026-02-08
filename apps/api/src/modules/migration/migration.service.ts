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

  private trimField(value: string | undefined | null): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  async importClientes(
    tenantId: string,
    clientes: ImportClienteItem[],
    fileName?: string,
  ): Promise<ImportResult> {
    this.logger.log(
      `=== IMPORT START === tenantId=${tenantId}, totalRows=${clientes.length}, fileName=${fileName || 'N/A'}`,
    );

    // Log sample of first 3 items for debugging
    const sample = clientes.slice(0, 3).map((c, i) => ({
      row: i + 1,
      tipoDocumento: c.tipoDocumento,
      numDocumento: c.numDocumento,
      nombre: c.nombre ? c.nombre.substring(0, 30) : '(empty)',
      direccion: c.direccion ? 'present' : '(empty)',
    }));
    this.logger.log(`Sample data (first 3): ${JSON.stringify(sample)}`);

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

    this.logger.log(`Import job created: ${job.id}`);

    const errors: ImportError[] = [];
    let successful = 0;
    let processed = 0;
    let validationFails = 0;
    let dbErrors = 0;

    for (let i = 0; i < clientes.length; i++) {
      const raw = clientes[i];
      processed++;

      // Trim all fields to avoid whitespace issues
      const cliente = {
        tipoDocumento: this.trimField(raw.tipoDocumento),
        numDocumento: this.trimField(raw.numDocumento),
        nombre: this.trimField(raw.nombre),
        nrc: this.trimField(raw.nrc),
        correo: this.trimField(raw.correo),
        telefono: this.trimField(raw.telefono),
        direccion: this.trimField(raw.direccion),
      };

      try {
        // Validate required fields
        const missingFields: string[] = [];
        if (!cliente.tipoDocumento) missingFields.push('tipoDocumento');
        if (!cliente.numDocumento) missingFields.push('numDocumento');
        if (!cliente.nombre) missingFields.push('nombre');
        if (!cliente.direccion) missingFields.push('direccion');

        if (missingFields.length > 0) {
          validationFails++;
          const msg = `Campos requeridos vacios: ${missingFields.join(', ')}`;
          errors.push({ row: i + 1, field: missingFields[0], message: msg });
          if (validationFails <= 5) {
            this.logger.warn(
              `Row ${i + 1} VALIDATION FAIL: ${msg} | data=${JSON.stringify(cliente)}`,
            );
          }
          continue;
        }

        // Upsert by numDocumento within tenant
        const result = await this.prisma.cliente.upsert({
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
        if (successful <= 5 || successful % 50 === 0) {
          this.logger.log(
            `Row ${i + 1} OK: clienteId=${result.id}, doc=${cliente.numDocumento}`,
          );
        }
      } catch (err) {
        dbErrors++;
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        errors.push({ row: i + 1, field: 'database', message: errorMessage });
        if (dbErrors <= 10) {
          this.logger.warn(
            `Row ${i + 1} DB ERROR: ${errorMessage} | doc=${raw.numDocumento}`,
          );
        }
      }
    }

    // Final summary log
    this.logger.log(
      `=== IMPORT COMPLETE === jobId=${job.id} | total=${clientes.length} | processed=${processed} | successful=${successful} | validationFails=${validationFails} | dbErrors=${dbErrors}`,
    );

    if (validationFails > 5) {
      this.logger.warn(
        `${validationFails} rows failed validation (showing first 5 in logs above)`,
      );
    }
    if (dbErrors > 10) {
      this.logger.warn(
        `${dbErrors} rows failed with DB errors (showing first 10 in logs above)`,
      );
    }

    // Update job status
    const estado =
      errors.length === 0
        ? 'COMPLETADO'
        : successful > 0
          ? 'COMPLETADO'
          : 'ERROR';

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
