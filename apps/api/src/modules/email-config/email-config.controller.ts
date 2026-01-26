import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import {
  EmailConfigService,
  EmailHealthService,
  EmailAssistanceService,
} from './services';
import {
  CreateEmailConfigDto,
  UpdateEmailConfigDto,
  TestEmailConfigDto,
  CreateEmailAssistanceRequestDto,
  UpdateEmailAssistanceRequestDto,
  AddMessageDto,
} from './dto';
import { ConfiguredBy, MessageSender, RequestStatus } from './types/email.types';

@ApiTags('email-config')
@Controller('email-config')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EmailConfigController {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly emailHealthService: EmailHealthService,
    private readonly emailAssistanceService: EmailAssistanceService,
  ) {}

  // =========================================================================
  // TENANT EMAIL CONFIGURATION ENDPOINTS
  // =========================================================================

  @Get()
  @ApiOperation({ summary: 'Get current tenant email configuration' })
  @ApiResponse({ status: 200, description: 'Email configuration retrieved' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfig(@CurrentUser() user: CurrentUserData) {
    const config = await this.emailConfigService.getConfig(user.tenantId!);

    if (!config) {
      return {
        configured: false,
        message: 'No email configuration found. Please configure your email settings.',
      };
    }

    // Don't expose sensitive fields
    return {
      configured: true,
      id: config.id,
      provider: config.provider,
      authMethod: config.authMethod,
      isActive: config.isActive,
      isVerified: config.isVerified,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail,
      rateLimitPerHour: config.rateLimitPerHour,
      configuredBy: config.configuredBy,
      lastTestAt: config.lastTestAt,
      verifiedAt: config.verifiedAt,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create or update email configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created/updated' })
  async createOrUpdateConfig(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateEmailConfigDto,
  ) {
    const config = await this.emailConfigService.upsertConfig(
      user.tenantId!,
      dto,
      ConfiguredBy.SELF,
      user.id,
    );

    return {
      message: 'Email configuration saved successfully',
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      isVerified: config.isVerified,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update email configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateEmailConfigDto,
  ) {
    const config = await this.emailConfigService.updateConfig(
      user.tenantId!,
      dto,
    );

    return {
      message: 'Email configuration updated successfully',
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      isVerified: config.isVerified,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete email configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted' })
  async deleteConfig(@CurrentUser() user: CurrentUserData) {
    await this.emailConfigService.deleteConfig(user.tenantId!);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test email configuration connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection(@CurrentUser() user: CurrentUserData) {
    const result = await this.emailConfigService.testConnection(user.tenantId!);

    return {
      success: result.success,
      responseTimeMs: result.responseTimeMs,
      message: result.success
        ? 'Connection successful! Your email configuration is working.'
        : `Connection failed: ${result.errorMessage}`,
      errorCode: result.errorCode,
    };
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Send a test email' })
  @ApiResponse({ status: 200, description: 'Test email result' })
  async sendTestEmail(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: TestEmailConfigDto,
  ) {
    const result = await this.emailConfigService.sendTestEmail(
      user.tenantId!,
      dto,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      message: result.success
        ? `Test email sent successfully to ${dto.recipientEmail}. Please check your inbox.`
        : `Failed to send test email: ${result.errorMessage}`,
    };
  }

  @Patch('activate')
  @ApiOperation({ summary: 'Activate or deactivate email sending' })
  @ApiResponse({ status: 200, description: 'Activation status updated' })
  async setActive(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { isActive: boolean },
  ) {
    const config = await this.emailConfigService.setActive(
      user.tenantId!,
      body.isActive,
    );

    return {
      message: body.isActive
        ? 'Email sending activated'
        : 'Email sending deactivated',
      isActive: config.isActive,
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get email send logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Email send logs' })
  async getSendLogs(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.emailConfigService.getSendLogs(
      user.tenantId!,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // =========================================================================
  // ASSISTANCE REQUEST ENDPOINTS
  // =========================================================================

  @Post('request-assistance')
  @ApiOperation({ summary: 'Request email configuration assistance' })
  @ApiResponse({ status: 201, description: 'Assistance request created' })
  async requestAssistance(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateEmailAssistanceRequestDto,
  ) {
    const request = await this.emailAssistanceService.createRequest(
      user.tenantId!,
      dto,
    );

    return {
      message:
        'Su solicitud ha sido recibida. Un miembro del equipo de Republicode se pondrá en contacto pronto.',
      requestId: request.id,
      status: request.status,
    };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get tenant assistance requests' })
  @ApiResponse({ status: 200, description: 'Assistance requests list' })
  async getMyRequests(@CurrentUser() user: CurrentUserData) {
    return this.emailAssistanceService.getTenantRequests(user.tenantId!);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get specific assistance request' })
  @ApiResponse({ status: 200, description: 'Assistance request details' })
  async getRequest(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.emailAssistanceService.getRequest(id, user.tenantId!);
  }

  @Post('requests/:id/messages')
  @ApiOperation({ summary: 'Add message to assistance request' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessageToRequest(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    // Verify this request belongs to the tenant
    await this.emailAssistanceService.getRequest(id, user.tenantId!);

    return this.emailAssistanceService.addMessage(
      id,
      MessageSender.TENANT,
      user.id,
      dto,
    );
  }

  // =========================================================================
  // HEALTH ENDPOINTS
  // =========================================================================

  @Get('health')
  @ApiOperation({ summary: 'Get email configuration health status' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async getHealth(@CurrentUser() user: CurrentUserData) {
    const config = await this.emailConfigService.getConfig(user.tenantId!);

    if (!config) {
      return {
        status: 'NOT_CONFIGURED',
        message: 'Email configuration not found',
      };
    }

    return this.emailHealthService.forceHealthCheck(user.tenantId!);
  }
}

// =========================================================================
// ADMIN CONTROLLER
// =========================================================================

@ApiTags('admin-email-config')
@Controller('admin/email-configs')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
@ApiBearerAuth()
export class EmailConfigAdminController {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly emailHealthService: EmailHealthService,
    private readonly emailAssistanceService: EmailAssistanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenant email configurations (admin)' })
  @ApiResponse({ status: 200, description: 'All email configurations' })
  async getAllConfigs() {
    return this.emailHealthService.getAllTenantHealth();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get email health dashboard stats (admin)' })
  @ApiResponse({ status: 200, description: 'Health dashboard statistics' })
  async getHealthDashboard() {
    const [stats, issues] = await Promise.all([
      this.emailHealthService.getDashboardStats(),
      this.emailHealthService.getTenantsWithIssues(),
    ]);

    return {
      stats,
      tenantsWithIssues: issues,
    };
  }

  @Post(':tenantId/check')
  @ApiOperation({ summary: 'Force health check for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Health check result' })
  async forceHealthCheck(@Param('tenantId') tenantId: string) {
    return this.emailHealthService.forceHealthCheck(tenantId);
  }

  // =========================================================================
  // ADMIN ASSISTANCE REQUESTS
  // =========================================================================

  @Get('requests')
  @ApiOperation({ summary: 'Get all assistance requests (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiResponse({ status: 200, description: 'All assistance requests' })
  async getAllRequests(@Query('status') status?: RequestStatus) {
    return this.emailAssistanceService.getAllRequests(status);
  }

  @Get('requests/stats')
  @ApiOperation({ summary: 'Get assistance request statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Request statistics' })
  async getRequestStats() {
    return this.emailAssistanceService.getRequestStats();
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get specific assistance request (admin)' })
  @ApiResponse({ status: 200, description: 'Assistance request details' })
  async getAdminRequest(@Param('id') id: string) {
    return this.emailAssistanceService.getRequest(id);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update assistance request (admin)' })
  @ApiResponse({ status: 200, description: 'Request updated' })
  async updateRequest(
    @Param('id') id: string,
    @Body() dto: UpdateEmailAssistanceRequestDto,
  ) {
    return this.emailAssistanceService.updateRequest(id, dto);
  }

  @Post('requests/:id/messages')
  @ApiOperation({ summary: 'Add message to assistance request (admin)' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addAdminMessage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.emailAssistanceService.addMessage(
      id,
      MessageSender.REPUBLICODE,
      user.id,
      dto,
    );
  }

  // =========================================================================
  // ADMIN CONFIG MANAGEMENT
  // =========================================================================

  @Post(':tenantId/configure')
  @ApiOperation({ summary: 'Configure email for a tenant (admin assisted setup)' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  async configureForTenant(
    @CurrentUser() user: CurrentUserData,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateEmailConfigDto,
  ) {
    const config = await this.emailConfigService.upsertConfig(
      tenantId,
      dto,
      ConfiguredBy.REPUBLICODE,
      user.id,
    );

    return {
      message: 'Email configuration created for tenant',
      id: config.id,
      tenantId: config.tenantId,
      provider: config.provider,
    };
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get email configuration for a specific tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Tenant email configuration' })
  async getTenantConfig(@Param('tenantId') tenantId: string) {
    const config = await this.emailConfigService.getConfig(tenantId);
    if (!config) {
      return { configured: false, config: null };
    }
    return { configured: true, config };
  }

  @Delete(':tenantId')
  @ApiOperation({ summary: 'Delete email configuration for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Configuration deleted' })
  async deleteTenantConfig(@Param('tenantId') tenantId: string) {
    await this.emailConfigService.deleteConfig(tenantId);
    return { message: 'Email configuration deleted' };
  }

  @Post(':tenantId/test-connection')
  @ApiOperation({ summary: 'Test email connection for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testTenantConnection(@Param('tenantId') tenantId: string) {
    return this.emailConfigService.testConnection(tenantId);
  }

  @Post(':tenantId/send-test')
  @ApiOperation({ summary: 'Send test email for a tenant (admin)' })
  @ApiResponse({ status: 200, description: 'Test email result' })
  async sendTestForTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: TestEmailConfigDto,
  ) {
    return this.emailConfigService.sendTestEmail(tenantId, dto);
  }
}
