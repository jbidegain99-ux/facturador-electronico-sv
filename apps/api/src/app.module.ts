import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DteModule } from './modules/dte/dte.module';
import { SignerModule } from './modules/signer/signer.module';
import { TransmitterModule } from './modules/transmitter/transmitter.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';

const imports: any[] = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.local', '.env'],
  }),
  PrismaModule,
  AuthModule,
  TenantsModule,
  DteModule,
  SignerModule,
  TransmitterModule,
  CatalogModule,
];

if (process.env.REDIS_URL) {
  imports.push(
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
  );
}

@Module({ imports })
export class AppModule {}
