import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MigrationService } from './migration.service';
import { ImportClientesDto } from './dto';

interface CurrentUserData {
  id: string;
  email: string;
  tenantId: string | null;
  rol: string;
}

@ApiTags('Migration')
@ApiBearerAuth()
@Controller('migration')
@UseGuards(JwtAuthGuard)
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('clientes')
  @ApiOperation({ summary: 'Importar clientes desde archivo' })
  async importClientes(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ImportClientesDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden importar datos');
    }

    if (!dto.clientes || dto.clientes.length === 0) {
      throw new BadRequestException('La lista de clientes no puede estar vacia');
    }

    if (dto.clientes.length > 1000) {
      throw new BadRequestException('Maximo 1000 registros por importacion');
    }

    return this.migrationService.importClientes(user.tenantId, dto.clientes, dto.fileName);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Listar jobs de importacion del tenant' })
  async getJobs(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden ver importaciones');
    }
    return this.migrationService.getJobs(user.tenantId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Obtener detalle de un job de importacion' })
  async getJob(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden ver importaciones');
    }
    return this.migrationService.getJob(user.tenantId, id);
  }
}
