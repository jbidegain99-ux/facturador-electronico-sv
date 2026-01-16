import { Module } from '@nestjs/common';
import { DteBuilderService } from './services/dte-builder.service';
import { DteValidatorService } from './services/dte-validator.service';
import { DteService } from './dte.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SignerModule } from '../signer/signer.module';
import { MhAuthModule } from '../mh-auth/mh-auth.module';

@Module({
  imports: [PrismaModule, SignerModule, MhAuthModule],
  providers: [DteBuilderService, DteValidatorService, DteService],
  exports: [DteBuilderService, DteValidatorService, DteService],
})
export class DteModule {}
