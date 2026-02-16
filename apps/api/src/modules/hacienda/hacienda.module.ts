import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { HaciendaController } from './hacienda.controller';
import { HaciendaAdminController } from './hacienda-admin.controller';
import { HaciendaService } from './hacienda.service';
import { CertificateService } from './services/certificate.service';
import { HaciendaAuthService } from './services/hacienda-auth.service';
import { TestDataGeneratorService } from './services/test-data-generator.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailConfigModule, // For EncryptionService
  ],
  controllers: [HaciendaController, HaciendaAdminController],
  providers: [
    HaciendaService,
    CertificateService,
    HaciendaAuthService,
    TestDataGeneratorService,
  ],
  exports: [
    HaciendaService,
    CertificateService,
    HaciendaAuthService,
    TestDataGeneratorService,
  ],
})
export class HaciendaModule {}
