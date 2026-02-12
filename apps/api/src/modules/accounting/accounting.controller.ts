import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountingService } from './accounting.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  QueryJournalDto,
  ReportQueryDto,
} from './dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { getPlanFeatures } from '../../common/plan-features';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountingController {
  private readonly logger = new Logger(AccountingController.name);

  constructor(private service: AccountingService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  private async ensureAccountingAccess(tenantId: string): Promise<void> {
    const tenant = await this.service['prisma'].tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    const planCode = tenant?.plan ?? 'DEMO';
    const features = getPlanFeatures(planCode);
    if (!features.accounting) {
      throw new ForbiddenException(
        'El módulo contable requiere el plan Pro. Actualiza tu plan para acceder.',
      );
    }
  }

  // ================================================================
  // CHART OF ACCOUNTS
  // ================================================================

  @Post('seed')
  @ApiOperation({ summary: 'Sembrar plan de cuentas de El Salvador' })
  @ApiResponse({ status: 201, description: 'Cuentas sembradas' })
  async seedChartOfAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    this.logger.log(`Seeding chart of accounts for tenant ${tenantId}`);
    return this.service.seedChartOfAccounts(tenantId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Obtener plan de cuentas (árbol)' })
  async getChartOfAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getChartOfAccounts(tenantId);
  }

  @Get('accounts/list')
  @ApiOperation({ summary: 'Obtener lista plana de cuentas activas' })
  async getAccountsList(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getAccountsList(tenantId);
  }

  @Get('accounts/postable')
  @ApiOperation({ summary: 'Obtener cuentas que permiten movimientos' })
  async getPostableAccounts(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getPostableAccounts(tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Crear cuenta contable' })
  @ApiResponse({ status: 201, description: 'Cuenta creada' })
  async createAccount(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateAccountDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.createAccount(tenantId, dto);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Actualizar cuenta contable' })
  async updateAccount(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.updateAccount(tenantId, id, dto);
  }

  @Post('accounts/:id/toggle-active')
  @ApiOperation({ summary: 'Activar/desactivar cuenta contable' })
  async toggleAccountActive(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.toggleAccountActive(tenantId, id);
  }

  // ================================================================
  // JOURNAL ENTRIES
  // ================================================================

  @Post('journal-entries')
  @ApiOperation({ summary: 'Crear partida contable' })
  @ApiResponse({ status: 201, description: 'Partida creada' })
  async createJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
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
  async getJournalEntries(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryJournalDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getJournalEntries(tenantId, query);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Obtener detalle de partida contable' })
  async getJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getJournalEntry(tenantId, id);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Contabilizar partida (DRAFT → POSTED)' })
  async postJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.postJournalEntry(tenantId, id, user.id);
  }

  @Post('journal-entries/:id/void')
  @ApiOperation({ summary: 'Anular partida contabilizada' })
  async voidJournalEntry(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.voidJournalEntry(tenantId, id, user.id, reason);
  }

  // ================================================================
  // REPORTS
  // ================================================================

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Balanza de comprobación' })
  async getTrialBalance(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getTrialBalance(tenantId, query.dateTo);
  }

  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Balance general' })
  async getBalanceSheet(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getBalanceSheet(tenantId);
  }

  @Get('reports/income-statement')
  @ApiOperation({ summary: 'Estado de resultados' })
  async getIncomeStatement(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getIncomeStatement(tenantId, query.dateFrom, query.dateTo);
  }

  @Get('reports/general-ledger')
  @ApiOperation({ summary: 'Libro mayor por cuenta' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getGeneralLedger(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);

    if (!query.accountId) {
      throw new ForbiddenException('Se requiere accountId');
    }

    return this.service.getGeneralLedger(tenantId, query.accountId, query.dateFrom, query.dateTo);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen del dashboard contable' })
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    await this.ensureAccountingAccess(tenantId);
    return this.service.getDashboardSummary(tenantId);
  }
}
