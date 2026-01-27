import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { BackupsService } from './backups.service';

@ApiTags('Backups')
@ApiBearerAuth()
@Controller('admin/backups')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get backup statistics' })
  async getStats() {
    return this.backupsService.getBackupStats();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get data summary for backup estimation' })
  async getDataSummary() {
    return this.backupsService.getDataSummary();
  }

  @Post('generate/full')
  @ApiOperation({ summary: 'Generate full system backup' })
  async generateFullBackup(@Res() res: Response) {
    const backupData = await this.backupsService.generateFullBackup();

    const filename = `backup-full-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(JSON.stringify(backupData, null, 2));
  }

  @Post('generate/tenant/:tenantId')
  @ApiOperation({ summary: 'Generate backup for specific tenant' })
  async generateTenantBackup(
    @Param('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const backupData = await this.backupsService.generateTenantBackup(tenantId);

    const filename = `backup-tenant-${tenantId}-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(JSON.stringify(backupData, null, 2));
  }

  @Get('preview/full')
  @ApiOperation({ summary: 'Preview full backup without downloading' })
  async previewFullBackup() {
    const backupData = await this.backupsService.generateFullBackup();
    return {
      metadata: backupData.metadata,
      summary: {
        totalTenants: Array.isArray(backupData.data) ? backupData.data.length : 1,
        timestamp: backupData.metadata.createdAt,
      },
    };
  }

  @Get('preview/tenant/:tenantId')
  @ApiOperation({ summary: 'Preview tenant backup without downloading' })
  async previewTenantBackup(@Param('tenantId') tenantId: string) {
    const backupData = await this.backupsService.generateTenantBackup(tenantId);
    const data = backupData.data as any;
    return {
      metadata: backupData.metadata,
      summary: {
        tenantName: data.tenant?.nombre,
        usersCount: data.users?.length || 0,
        clientesCount: data.clientes?.length || 0,
        dtesCount: data.dtes?.length || 0,
        hasOnboarding: !!data.onboarding,
        hasEmailConfig: !!data.emailConfig,
        timestamp: backupData.metadata.createdAt,
      },
    };
  }
}
