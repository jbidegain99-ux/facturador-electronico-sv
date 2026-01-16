import { Module } from '@nestjs/common';
import { MhAuthService } from './mh-auth.service';
import { MhAuthController } from './mh-auth.controller';

@Module({
  controllers: [MhAuthController],
  providers: [MhAuthService],
  exports: [MhAuthService],
})
export class MhAuthModule {}
