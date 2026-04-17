import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
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
import { QuotesModule } from './modules/quotes/quotes.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CashFlowModule } from './modules/cash-flow/cash-flow.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ChatModule } from './modules/chat/chat.module';
import { SyncModule } from './modules/sync/sync.module';
import { TenantGuard } from './modules/rbac/guards/tenant.guard';
import { RbacGuard } from './modules/rbac/guards/rbac.guard';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.local', '.env'],
  }),
  ScheduleModule.forRoot(),
  ThrottlerModule.forRoot([
    {
      name: 'short',
      ttl: 1000,      // 1 second
      limit: 20,       // 20 requests per second per IP
    },
    {
      name: 'medium',
      ttl: 60000,      // 1 minute
      limit: 300,      // 300 requests per minute per IP
    },
    {
      name: 'long',
      ttl: 3600000,    // 1 hour
      limit: 5000,     // 5000 requests per hour per IP
    },
  ]),
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
  QuotesModule,
  AccountingModule,
  PurchasesModule,
  WebhooksModule,
  SucursalesModule,
  PaymentsModule,
  CashFlowModule,
  ReportsModule,
  RbacModule,
  ChatModule,
  SyncModule,
];

@Module({
  imports,
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
