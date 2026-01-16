import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DteService } from './dte.service';

interface AuthRequest extends Request {
  user: {
    tenantId: string;
  };
}

@ApiTags('dte')
@Controller('dte')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DteController {
  constructor(private dteService: DteService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo DTE' })
  create(
    @Request() req: AuthRequest,
    @Body() createDteDto: { tipoDte: string; data: Record<string, unknown> },
  ) {
    return this.dteService.createDte(req.user.tenantId, createDteDto.tipoDte, createDteDto.data);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Firmar DTE' })
  sign(@Param('id') id: string) {
    return this.dteService.signDte(id);
  }

  @Post(':id/transmit')
  @ApiOperation({ summary: 'Transmitir DTE al MH' })
  transmit(@Param('id') id: string) {
    return this.dteService.transmitDte(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar DTEs del tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Request() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dteService.findByTenant(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener DTE por ID' })
  findOne(@Param('id') id: string) {
    return this.dteService.findOne(id);
  }
}
