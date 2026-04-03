import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';

interface AuthenticatedRequest {
  user: { tenantId: string };
}

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Get()
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'ISO timestamp — returns records modified since this date',
  })
  async getChanges(
    @Request() req: AuthenticatedRequest,
    @Query('since') since?: string,
  ) {
    return this.syncService.getChangesSince(req.user.tenantId, since || null);
  }
}
