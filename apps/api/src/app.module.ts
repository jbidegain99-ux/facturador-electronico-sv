import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DteModule } from './modules/dte/dte.module';
import { SignerModule } from './modules/signer/signer.module';
import { TransmitterModule } from './modules/transmitter/transmitter.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
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
  ],
})
export class AppModule {}
