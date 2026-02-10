import { Module, DynamicModule, Type, ForwardReference } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { DteModule } from './modules/dte/dte.module';
import { SignerModule } from './modules/signer/signer.module';
import { TransmitterModule } from './modules/transmitter/transmitter.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { EmailConfigModule } from './modules/email-config/email-config.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SupportModule } from './modules/support/support.module';
import { CatalogosAdminModule } from './modules/catalogos-admin/catalogos-admin.module';
import { PlansModule } from './modules/plans/plans.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { BackupsModule } from './modules/backups/backups.module';
import { HaciendaModule } from './modules/hacienda/hacienda.module';
import { MigrationModule } from './modules/migration/migration.module';
import { RecurringInvoicesModule } from './modules/recurring-invoices/recurring-invoices.module';
import { CatalogItemsModule } from './modules/catalog-items/catalog-items.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

type NestImport = Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference;

const imports: NestImport[] = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.local', '.env'],
  }),
  ScheduleModule.forRoot(),
  PrismaModule,
  HealthModule,
  AuthModule,
  TenantsModule,
  ClientesModule,
  DteModule,
  SignerModule,
  TransmitterModule,
  CatalogModule,
  SuperAdminModule,
  EmailConfigModule,
  OnboardingModule,
  SupportModule,
  CatalogosAdminModule,
  PlansModule,
  NotificationsModule,
  AuditLogsModule,
  BackupsModule,
  HaciendaModule,
  MigrationModule,
  RecurringInvoicesModule,
  CatalogItemsModule,
  DashboardModule,
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
