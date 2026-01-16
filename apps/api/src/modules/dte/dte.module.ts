import { Module } from '@nestjs/common';
import { DteService } from './dte.service';
import { DteController } from './dte.controller';
import { SignerModule } from '../signer/signer.module';
import { TransmitterModule } from '../transmitter/transmitter.module';

@Module({
  imports: [SignerModule, TransmitterModule],
  controllers: [DteController],
  providers: [DteService],
  exports: [DteService],
})
export class DteModule {}
