import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('clientes')
@Controller('clientes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(private clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Usuario no tiene tenant asignado' })
  @ApiResponse({ status: 409, description: 'Ya existe un cliente con este documento' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createClienteDto: CreateClienteDto,
  ) {
    this.logger.log(`User ${user.email} creating cliente`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.create(user.tenantId, createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes del tenant con paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numero de pagina (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por pagina (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, documento o correo' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo para ordenar (nombre, numDocumento, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Orden: asc o desc (default: desc)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: PaginationQueryDto,
  ) {
    this.logger.log(`User ${user.email} listing clientes, page=${query.page}, limit=${query.limit}, search=${query.search || 'none'}`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200, description: 'Datos del cliente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${user.email} getting cliente ${id}`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.findOne(user.tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un cliente con este documento' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    this.logger.log(`User ${user.email} updating cliente ${id}`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.update(user.tenantId, id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar - tiene documentos asociados' })
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${user.email} deleting cliente ${id}`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.remove(user.tenantId, id);
  }
}
