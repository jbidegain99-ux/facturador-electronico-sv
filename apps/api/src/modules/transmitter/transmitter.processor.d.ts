import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TransmitterService, TransmitJobData } from './transmitter.service';
export declare class TransmitterProcessor extends WorkerHost {
    private readonly transmitterService;
    private readonly logger;
    constructor(transmitterService: TransmitterService);
    process(job: Job<TransmitJobData>): Promise<{
        success: boolean;
        result?: unknown;
        error?: string;
    }>;
    onCompleted(job: Job<TransmitJobData>): void;
    onFailed(job: Job<TransmitJobData>, error: Error): void;
    onProgress(job: Job<TransmitJobData>, progress: number): void;
}
//# sourceMappingURL=transmitter.processor.d.ts.map