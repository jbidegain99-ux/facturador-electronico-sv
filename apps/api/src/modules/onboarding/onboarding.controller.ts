import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
  OnboardingService,
  TestExecutionService,
  OnboardingCommunicationService,
} from './services';
import {
  StartOnboardingDto,
  UpdateCompanyInfoDto,
  SetHaciendaCredentialsDto,
  SetDteTypesDto,
  UploadTestCertificateDto,
  UploadProdCertificateDto,
  SetApiCredentialsDto,
  CompleteStepDto,
  GoToStepDto,
  ExecuteTestDto,
  ExecuteEventTestDto,
  AddCommunicationDto,
} from './dto';
import { OnboardingStatus, OnboardingStep, StepStatus } from '@prisma/client';

// =========================================================================
// TENANT CONTROLLER
// =========================================================================

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly testExecutionService: TestExecutionService,
    private readonly communicationService: OnboardingCommunicationService,
  ) {}

  // -------------------------------------------------------------------------
  // ONBOARDING STATE
  // -------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Get current onboarding state' })
  @ApiResponse({ status: 200, description: 'Onboarding state retrieved' })
  async getOnboarding(@CurrentUser() user: CurrentUserData) {
    return this.onboardingService.getOnboarding(user.tenantId!);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get onboarding progress summary' })
  @ApiResponse({ status: 200, description: 'Progress summary' })
  async getProgress(@CurrentUser() user: CurrentUserData) {
    return this.onboardingService.getProgress(user.tenantId!);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start the onboarding process' })
  @ApiResponse({ status: 201, description: 'Onboarding started' })
  async startOnboarding(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: StartOnboardingDto,
  ) {
    return this.onboardingService.startOnboarding(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  // -------------------------------------------------------------------------
  // STEP: COMPANY INFO
  // -------------------------------------------------------------------------

  @Patch('company-info')
  @ApiOperation({ summary: 'Update company information' })
  @ApiResponse({ status: 200, description: 'Company info updated' })
  async updateCompanyInfo(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCompanyInfoDto,
  ) {
    return this.onboardingService.updateCompanyInfo(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  // -------------------------------------------------------------------------
  // STEP: HACIENDA CREDENTIALS
  // -------------------------------------------------------------------------

  @Post('hacienda-credentials')
  @ApiOperation({ summary: 'Set Hacienda credentials' })
  @ApiResponse({ status: 200, description: 'Credentials saved' })
  async setHaciendaCredentials(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SetHaciendaCredentialsDto,
  ) {
    return this.onboardingService.setHaciendaCredentials(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  // -------------------------------------------------------------------------
  // STEP: DTE TYPE SELECTION
  // -------------------------------------------------------------------------

  @Get('dte-types')
  @ApiOperation({ summary: 'Get selected and available DTE types' })
  @ApiResponse({ status: 200, description: 'DTE types list' })
  async getDteTypes(@CurrentUser() user: CurrentUserData) {
    return this.onboardingService.getDteTypes(user.tenantId!);
  }

  @Post('dte-types')
  @ApiOperation({ summary: 'Select DTE types to emit' })
  @ApiResponse({ status: 200, description: 'DTE types saved' })
  async setDteTypes(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SetDteTypesDto,
  ) {
    return this.onboardingService.setDteTypes(user.tenantId!, dto, user.id);
  }

  // -------------------------------------------------------------------------
  // STEP: CERTIFICATES
  // -------------------------------------------------------------------------

  @Post('test-certificate')
  @ApiOperation({ summary: 'Upload test environment certificate' })
  @ApiResponse({ status: 200, description: 'Test certificate uploaded' })
  async uploadTestCertificate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadTestCertificateDto,
  ) {
    return this.onboardingService.uploadTestCertificate(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  @Post('prod-certificate')
  @ApiOperation({ summary: 'Upload production certificate' })
  @ApiResponse({ status: 200, description: 'Production certificate uploaded' })
  async uploadProdCertificate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadProdCertificateDto,
  ) {
    return this.onboardingService.uploadProdCertificate(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  // -------------------------------------------------------------------------
  // STEP: API CREDENTIALS
  // -------------------------------------------------------------------------

  @Post('test-api-credentials')
  @ApiOperation({ summary: 'Set test environment API credentials' })
  @ApiResponse({ status: 200, description: 'Test API credentials saved' })
  async setTestApiCredentials(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SetApiCredentialsDto,
  ) {
    return this.onboardingService.setTestApiCredentials(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  @Post('prod-api-credentials')
  @ApiOperation({ summary: 'Set production API credentials' })
  @ApiResponse({ status: 200, description: 'Production API credentials saved' })
  async setProdApiCredentials(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SetApiCredentialsDto,
  ) {
    return this.onboardingService.setProdApiCredentials(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  // -------------------------------------------------------------------------
  // STEP NAVIGATION
  // -------------------------------------------------------------------------

  @Post('complete-step')
  @ApiOperation({ summary: 'Complete current step and advance' })
  @ApiResponse({ status: 200, description: 'Step completed' })
  async completeStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CompleteStepDto,
  ) {
    return this.onboardingService.completeStep(user.tenantId!, dto, user.id);
  }

  @Post('go-to-step')
  @ApiOperation({ summary: 'Navigate to a previous step' })
  @ApiResponse({ status: 200, description: 'Navigated to step' })
  async goToStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GoToStepDto,
  ) {
    return this.onboardingService.goToStep(user.tenantId!, dto);
  }

  // -------------------------------------------------------------------------
  // TEST EXECUTION
  // -------------------------------------------------------------------------

  @Get('test-progress')
  @ApiOperation({ summary: 'Get test execution progress' })
  @ApiResponse({ status: 200, description: 'Test progress summary' })
  async getTestProgress(@CurrentUser() user: CurrentUserData) {
    return this.testExecutionService.getTestProgress(user.tenantId!);
  }

  @Post('execute-test')
  @ApiOperation({ summary: 'Execute a DTE test' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async executeTest(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ExecuteTestDto,
  ) {
    return this.testExecutionService.executeDteTest(user.tenantId!, dto);
  }

  @Post('execute-event-test')
  @ApiOperation({ summary: 'Execute an event test (anulacion, contingencia, etc)' })
  @ApiResponse({ status: 200, description: 'Event test result' })
  async executeEventTest(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ExecuteEventTestDto,
  ) {
    return this.testExecutionService.executeEventTest(user.tenantId!, dto);
  }

  @Get('test-history')
  @ApiOperation({ summary: 'Get test execution history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Test history' })
  async getTestHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: string,
  ) {
    return this.testExecutionService.getTestHistory(
      user.tenantId!,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // -------------------------------------------------------------------------
  // COMMUNICATIONS
  // -------------------------------------------------------------------------

  @Get('communications')
  @ApiOperation({ summary: 'Get onboarding communications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Communications list' })
  async getCommunications(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.getCommunications(
      user.tenantId!,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('communications')
  @ApiOperation({ summary: 'Send a communication message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async addCommunication(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddCommunicationDto,
  ) {
    return this.communicationService.addClientCommunication(
      user.tenantId!,
      dto,
      user.id,
    );
  }

  @Post('communications/:id/read')
  @ApiOperation({ summary: 'Mark a communication as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  async markAsRead(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.communicationService.markAsRead(user.tenantId!, id);
  }

  @Post('communications/read-all')
  @ApiOperation({ summary: 'Mark all communications as read' })
  @ApiResponse({ status: 200, description: 'All marked as read' })
  async markAllAsRead(@CurrentUser() user: CurrentUserData) {
    return this.communicationService.markAllAsRead(user.tenantId!);
  }
}

// =========================================================================
// ADMIN CONTROLLER
// =========================================================================

@ApiTags('admin-onboarding')
@Controller('admin/onboarding')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
@ApiBearerAuth()
export class OnboardingAdminController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly testExecutionService: TestExecutionService,
    private readonly communicationService: OnboardingCommunicationService,
  ) {}

  // -------------------------------------------------------------------------
  // LIST AND STATS
  // -------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Get all onboarding processes (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: OnboardingStatus })
  @ApiResponse({ status: 200, description: 'All onboarding processes' })
  async getAll(@Query('status') status?: OnboardingStatus) {
    return this.onboardingService.getAll(status);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get specific tenant onboarding (admin)' })
  @ApiResponse({ status: 200, description: 'Onboarding details' })
  async getTenantOnboarding(@Param('tenantId') tenantId: string) {
    return this.onboardingService.getOnboarding(tenantId);
  }

  @Get(':tenantId/progress')
  @ApiOperation({ summary: 'Get tenant onboarding progress (admin)' })
  @ApiResponse({ status: 200, description: 'Progress summary' })
  async getTenantProgress(@Param('tenantId') tenantId: string) {
    return this.onboardingService.getProgress(tenantId);
  }

  // -------------------------------------------------------------------------
  // ADMIN STEP MANAGEMENT
  // -------------------------------------------------------------------------

  @Patch(':tenantId/step')
  @ApiOperation({ summary: 'Update a step status (admin)' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  async updateStep(
    @CurrentUser() user: CurrentUserData,
    @Param('tenantId') tenantId: string,
    @Body()
    body: {
      step: OnboardingStep;
      status: StepStatus;
      notes?: string;
      blockerReason?: string;
    },
  ) {
    return this.onboardingService.adminUpdateStep(
      tenantId,
      body.step,
      body.status,
      user.id,
      body.notes,
      body.blockerReason,
    );
  }

  // -------------------------------------------------------------------------
  // TEST PROGRESS (ADMIN)
  // -------------------------------------------------------------------------

  @Get(':tenantId/test-progress')
  @ApiOperation({ summary: 'Get tenant test progress (admin)' })
  @ApiResponse({ status: 200, description: 'Test progress' })
  async getTenantTestProgress(@Param('tenantId') tenantId: string) {
    return this.testExecutionService.getTestProgress(tenantId);
  }

  // -------------------------------------------------------------------------
  // COMMUNICATIONS (ADMIN)
  // -------------------------------------------------------------------------

  @Get('communications/all')
  @ApiOperation({ summary: 'Get all communications (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'All communications' })
  async getAllCommunications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.getAllCommunications(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':tenantId/communications')
  @ApiOperation({ summary: 'Get tenant communications (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Tenant communications' })
  async getTenantCommunications(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.getCommunications(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post(':onboardingId/communications')
  @ApiOperation({ summary: 'Send communication to tenant (admin)' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendCommunication(
    @CurrentUser() user: CurrentUserData,
    @Param('onboardingId') onboardingId: string,
    @Body() dto: AddCommunicationDto,
  ) {
    return this.communicationService.addAdminCommunication(
      onboardingId,
      dto,
      user.id,
    );
  }
}
