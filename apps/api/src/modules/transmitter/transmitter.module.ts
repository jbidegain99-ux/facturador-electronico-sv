import { Module } from '@nestjs/common';
import { TransmitterService } from './transmitter.service';
import { TransmitterController } from './transmitter.controller';
import { MhAuthModule } from '../mh-auth/mh-auth.module';
import { SignerModule } from '../signer/signer.module';
import { DteModule } from '../dte/dte.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [MhAuthModule, SignerModule, DteModule, PrismaModule],
  controllers: [TransmitterController],
  providers: [TransmitterService],
  exports: [TransmitterService],
})
export class TransmitterModule {}
