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
  @ApiOperation({ summary: 'Listar clientes del tenant' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, documento o correo' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('search') search?: string,
  ) {
    this.logger.log(`User ${user.email} listing clientes, search: ${search || 'none'}`);

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.clientesService.findAll(user.tenantId, search);
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
