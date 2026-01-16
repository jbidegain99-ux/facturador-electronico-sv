import { Module } from '@nestjs/common';
import { TransmitterService } from './transmitter.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TransmitterService],
  exports: [TransmitterService],
})
export class TransmitterModule {}
