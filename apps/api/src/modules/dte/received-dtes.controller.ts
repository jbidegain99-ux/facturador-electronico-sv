import { Body, Controller, Get, Param, Post, Query, Res, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DteImportParserService } from './services/dte-import-parser.service';
import { ReceivedDtesService } from './services/received-dtes.service';
import { ReceivedDtesExportService } from './services/received-dtes-export.service';
import { PreviewDteDto, DteFormat } from './dto/preview-dte.dto';
import { ImportReceivedDteDto } from './dto/import-received-dte.dto';
import { ReceivedDtesFilterDto } from './dto/received-dtes-filter.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('received-dtes')
@Controller('received-dtes')
@ApiBearerAuth()
export class ReceivedDtesController {
  private readonly logger = new Logger(ReceivedDtesController.name);

  constructor(
    private readonly parser: DteImportParserService,
    private readonly service: ReceivedDtesService,
    private readonly exporter: ReceivedDtesExportService,
  ) {}

  @Get()
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Listar DTEs recibidos con filtros + paginación' })
  findAll(@CurrentUser() user: CurrentUserData, @Query() filters: ReceivedDtesFilterDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.findAll(user.tenantId, filters);
  }

  @Get('export')
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Exportar DTEs recibidos a XLSX' })
  async exportXlsx(
    @CurrentUser() user: CurrentUserData,
    @Query() filters: ReceivedDtesFilterDto,
    @Res() res: Response,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    const { page: _p, limit: _l, ...rest } = filters;
    const buf = await this.exporter.exportXlsx(user.tenantId, rest);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="dtes-recibidos.xlsx"');
    res.send(buf);
  }

  @Get(':id')
  @RequirePermission('purchases:read')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Importar DTE manualmente (persiste en ReceivedDTE)' })
  createManual(@CurrentUser() user: CurrentUserData, @Body() dto: ImportReceivedDteDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.createManual(user.tenantId, user.id, dto);
  }

  @Post(':id/retry-mh')
  @RequirePermission('purchases:create')
  retryMh(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.retryMhVerify(user.tenantId, id);
  }

  @Post(':id/re-parse')
  @RequirePermission('purchases:create')
  reParse(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.reParse(user.tenantId, id);
  }

  @Post('preview')
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Parsear DTE sin persistir (preview para form de compra)' })
  preview(@Body() dto: PreviewDteDto) {
    if (dto.format === DteFormat.XML) {
      throw new BadRequestException({
        code: 'FORMAT_NOT_SUPPORTED',
        message: 'XML format not yet supported; please convert to JSON first',
      });
    }
    return this.parser.parse(dto.content);
  }
}
