import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  QueryJournalDto,
  ReportQueryDto,
  SimulateInvoiceDto,
  UpdateAccountingConfigDto,
  UpsertMappingDto,
} from './dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_MAPPINGS } from './default-mappings.data';

@ApiTags('accounting')
@Controller('accounting')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('accounting')
export class AccountingController {
  private readonly logger = new Logger(AccountingController.name);

  constructor(
    private service: AccountingService,
    private prisma: PrismaService,
  ) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  // ================================================================
  // ACCOUNTING AUTOMATION CONFIG
  // ================================================================

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración de automatización contable' })
  @RequirePermission('accounting:read')
  async getConfig(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { autoJournalEnabled: true, autoJournalTrigger: true },
    });
    return tenant ?? { autoJournalEnabled: false, autoJournalTrigger: 'ON_APPROVED' };
  }

  @Patch('config')
  @ApiOperation({ summary: 'Actualizar configuración de automatización contable' })
  @RequirePermission('config:update')
  async updateConfig(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateAccountingConfigDto,
  ) {
    const tenantId = this.ensureTenant(user);
    const data: Record<string, unknown> = {};
    if (dto.autoJournalEnabled !== undefined) data.autoJournalEnabled = dto.autoJournalEnabled;
    if (dto.autoJournalTrigger !== undefined) data.autoJournalTrigger = dto.autoJournalTrigger;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: { autoJournalEnabled: true, autoJournalTrigger: true },
    });
  }

  // ================================================================
  // ACCOUNT MAPPING RULES
  // ================================================================

  @Get('mappings')
  @ApiOperation({ summary: 'Listar reglas de mapeo contable' })
  @RequirePermission('accounting:read')
  async getMappings(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.prisma.accountMappingRule.findMany({
      where: { tenantId },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
      orderBy: { operation: 'asc' },
    });
  }

  @Post('mappings')
  @ApiOperation({ summary: 'Crear o actualizar regla de mapeo (upsert por operación)' })
  @ApiResponse({ status: 201, description: 'Mapeo creado/actualizado' })
  @RequirePermission('accounting:create')
  async upsertMapping(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpsertMappingDto,
  ) {
    const tenantId = this.ensureTenant(user);

    const existing = await this.prisma.accountMappingRule.findFirst({
      where: { tenantId, operation: dto.operation },
    });

    const mappingConfig = dto.mappingConfig ? JSON.stringify(dto.mappingConfig) : null;

    if (existing) {
      return this.prisma.accountMappingRule.update({
        where: { id: existing.id },
        data: {
          description: dto.description,
          debitAccountId: dto.debitAccountId,
          creditAccountId: dto.creditAccountId,
          mappingConfig,
        },
        include: {
          debitAccount: { select: { id: true, code: true, name: true } },
          creditAccount: { select: { id: true, code: true, name: true } },
        },
      });
    }

    return this.prisma.accountMappingRule.create({
      data: {
        tenantId,
        operation: dto.operation,
        description: dto.description,
        debitAccountId: dto.debitAccountId,
        creditAccountId: dto.creditAccountId,
        mappingConfig,
      },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  @Delete('mappings/:id')
  @ApiOperation({ summary: 'Eliminar regla de mapeo' })
  @RequirePermission('accounting:create')
  async deleteMapping(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const rule = await this.prisma.accountMappingRule.findFirst({
      where: { id, tenantId },
    });

    if (!rule) {
      throw new ForbiddenException('Regla de mapeo no encontrada');
    }

    await this.prisma.accountMappingRule.delete({ where: { id } });
    return { deleted: true };
  }

  @Post('mappings/seed')
  @ApiOperation({ summary: 'Generar mapeos predeterminados para El Salvador' })
  @ApiResponse({ status: 201, description: 'Mapeos predeterminados creados' })
  @RequirePermission('accounting:create')
  async seedMappings(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    let created = 0;
    let skipped = 0;

    for (const mapping of DEFAULT_MAPPINGS) {
      // Check if mapping already exists
      const existing = await this.prisma.accountMappingRule.findFirst({
        where: { tenantId, operation: mapping.operation },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Find accounts by code
      const debitAccount = await this.prisma.accountingAccount.findUnique({
        where: { tenantId_code: { tenantId, code: mapping.debitCode } },
      });
      const creditAccount = await this.prisma.accountingAccount.findUnique({
        where: { tenantId_code: { tenantId, code: mapping.creditCode } },
      });

      if (!debitAccount || !creditAccount) {
        this.logger.warn(
          `Skipping seed for ${mapping.operation}: accounts ${mapping.debitCode}/${mapping.creditCode} not found`,
        );
        skipped++;
        continue;
      }

      await this.prisma.accountMappingRule.create({
        data: {
          tenantId,
          operation: mapping.operation,
          description: mapping.description,
          debitAccountId: debitAccount.id,
          creditAccountId: creditAccount.id,
          mappingConfig: JSON.stringify(mapping.mappingConfig),
        },
      });
      created++;
    }

    return { created, skipped, total: DEFAULT_MAPPINGS.length };
  }

  // ================================================================
  // CHART OF ACCOUNTS
  // ================================================================

  @Post('seed')
  @ApiOperation({ summary: 'Sembrar plan de cuentas de El Salvador' })
  @ApiResponse({ status: 201, description: 'Cuentas sembradas' })
  @RequirePermission('accounting:create')
  async seedChartOfAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);

    this.logger.log(`Seeding chart of accounts for tenant ${tenantId}`);
    return this.service.seedChartOfAccounts(tenantId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Obtener plan de cuentas (árbol)' })
  @RequirePermission('accounting:read')
  async getChartOfAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);

    return this.service.getChartOfAccounts(tenantId);
  }

  @Get('accounts/list')
  @ApiOperation({ summary: 'Obtener lista plana de cuentas activas' })
  @RequirePermission('accounting:read')
  async getAccountsList(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);

    return this.service.getAccountsList(tenantId);
  }

  @Get('accounts/postable')
  @ApiOperation({ summary: 'Obtener cuentas que permiten movimientos' })
  @RequirePermission('accounting:read')
  async getPostableAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);

    return this.service.getPostableAccounts(tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Crear cuenta contable' })
  @ApiResponse({ status: 201, description: 'Cuenta creada' })
  @RequirePermission('accounting:create')
  async createAccount(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateAccountDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.createAccount(tenantId, dto);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Actualizar cuenta contable' })
  @RequirePermission('accounting:create')
  async updateAccount(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.updateAccount(tenantId, id, dto);
  }

  @Post('accounts/:id/toggle-active')
  @ApiOperation({ summary: 'Activar/desactivar cuenta contable' })
  @RequirePermission('accounting:create')
  async toggleAccountActive(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.toggleAccountActive(tenantId, id);
  }

  // ================================================================
  // JOURNAL ENTRIES
  // ================================================================

  @Post('journal-entries')
  @ApiOperation({ summary: 'Crear partida contable' })
  @ApiResponse({ status: 201, description: 'Partida creada' })
  @RequirePermission('accounting:create')
  async createJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.createJournalEntry(tenantId, dto, user.id);
  }

  @Get('journal-entries')
  @ApiOperation({ summary: 'Listar partidas contables' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'entryType', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequirePermission('accounting:read')
  async getJournalEntries(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryJournalDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.getJournalEntries(tenantId, query);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Obtener detalle de partida contable' })
  @RequirePermission('accounting:read')
  async getJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.getJournalEntry(tenantId, id);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Contabilizar partida (DRAFT → POSTED)' })
  @RequirePermission('accounting:approve')
  async postJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.postJournalEntry(tenantId, id, user.id);
  }

  @Post('journal-entries/:id/void')
  @ApiOperation({ summary: 'Anular partida contabilizada' })
  @RequirePermission('accounting:approve')
  async voidJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.voidJournalEntry(tenantId, id, user.id, reason);
  }

  // ================================================================
  // REPORTS
  // ================================================================

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Balanza de comprobación' })
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('advanced_reports')
  @RequirePermission('accounting:read')
  async getTrialBalance(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.getTrialBalance(tenantId, query.dateTo);
  }

  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Balance general' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Fecha corte (asOfDate)' })
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('advanced_reports')
  @RequirePermission('accounting:read')
  async getBalanceSheet(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.getBalanceSheet(tenantId, query.dateTo);
  }

  @Get('reports/income-statement')
  @ApiOperation({ summary: 'Estado de resultados' })
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('advanced_reports')
  @RequirePermission('accounting:read')
  async getIncomeStatement(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.getIncomeStatement(tenantId, query.dateFrom, query.dateTo);
  }

  @Get('reports/general-ledger')
  @ApiOperation({ summary: 'Libro mayor por cuenta' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('advanced_reports')
  @RequirePermission('accounting:read')
  async getGeneralLedger(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);


    if (!query.accountId) {
      throw new ForbiddenException('Se requiere accountId');
    }

    return this.service.getGeneralLedger(tenantId, query.accountId, query.dateFrom, query.dateTo);
  }

  // ================================================================
  // SIMULATION (Test Mode)
  // ================================================================

  @Post('simulate-invoice')
  @ApiOperation({ summary: 'Simular impacto contable de una factura sin emitir' })
  @ApiResponse({ status: 200, description: 'Simulación de partida contable' })
  @RequirePermission('accounting:read')
  async simulateInvoice(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SimulateInvoiceDto,
  ) {
    const tenantId = this.ensureTenant(user);

    return this.service.simulateInvoiceImpact(tenantId, dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen del dashboard contable' })
  @RequirePermission('accounting:read')
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);

    return this.service.getDashboardSummary(tenantId);
  }
}
