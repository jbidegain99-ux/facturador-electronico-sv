import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TransmitterService } from './transmitter.service';
import { TransmitterController } from './transmitter.controller';
import { TransmitterProcessor } from './transmitter.processor';
import { MhAuthModule } from '../mh-auth/mh-auth.module';
import { SignerModule } from '../signer/signer.module';
import { DteModule } from '../dte/dte.module';

const bullImports = process.env.REDIS_URL
  ? [
      BullModule.registerQueue({
        name: 'dte-transmission',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      }),
    ]
  : [];

const bullProviders = process.env.REDIS_URL ? [TransmitterProcessor] : [];

@Module({
  imports: [...bullImports, MhAuthModule, SignerModule, DteModule],
  controllers: [TransmitterController],
  providers: [TransmitterService, ...bullProviders],
  exports: [TransmitterService],
})
export class TransmitterModule {}
