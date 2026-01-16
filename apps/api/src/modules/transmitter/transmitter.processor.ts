import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TransmitterService, TransmitJobData } from './transmitter.service';

@Processor('dte-transmission')
export class TransmitterProcessor extends WorkerHost {
  private readonly logger = new Logger(TransmitterProcessor.name);

  constructor(private readonly transmitterService: TransmitterService) {
    super();
  }

  async process(job: Job<TransmitJobData>): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const { dteId, nit, password, env } = job.data;

    this.logger.log(`Processing job ${job.id} for DTE: ${dteId} (Attempt ${job.attemptsMade + 1})`);

    try {
      const result = await this.transmitterService.transmitSync(dteId, nit, password, env);

      if (!result.success) {
        // Si falla, lanzar error para que BullMQ haga retry
        throw new Error(result.error || 'Transmission failed');
      }

      this.logger.log(`Job ${job.id} completed successfully for DTE: ${dteId}`);

      return {
        success: true,
        result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${job.id} failed for DTE: ${dteId} - ${errorMessage}`);

      // Si es el último intento, marcar como rechazado
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.transmitterService.updateDTE(dteId, { status: 'RECHAZADO' });
        this.transmitterService.addLog({
          dteId,
          action: 'ERROR',
          status: 'FAILURE',
          message: `Transmisión fallida después de ${job.attemptsMade + 1} intentos: ${errorMessage}`,
        });
      } else {
        this.transmitterService.addLog({
          dteId,
          action: 'RETRY',
          status: 'FAILURE',
          message: `Reintento ${job.attemptsMade + 1} fallido: ${errorMessage}`,
        });
      }

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TransmitJobData>) {
    this.logger.log(`Job ${job.id} completed for DTE: ${job.data.dteId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TransmitJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed for DTE: ${job.data.dteId} - ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<TransmitJobData>, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }
}
