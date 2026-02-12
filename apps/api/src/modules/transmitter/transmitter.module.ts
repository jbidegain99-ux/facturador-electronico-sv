import { Module } from '@nestjs/common';
import { TransmitterService } from './transmitter.service';
import { TransmitterController } from './transmitter.controller';
import { MhAuthModule } from '../mh-auth/mh-auth.module';
import { SignerModule } from '../signer/signer.module';
import { DteModule } from '../dte/dte.module';

@Module({
  imports: [MhAuthModule, SignerModule, DteModule],
  controllers: [TransmitterController],
  providers: [TransmitterService],
  exports: [TransmitterService],
})
export class TransmitterModule {}
