import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'tickets');

// Ensure upload directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ticketFileStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

interface CurrentUserData {
  id: string;
  email: string;
  tenantId: string | null;
  rol: string;
}

// ============ USER ENDPOINTS ============
@ApiTags('support-tickets')
@ApiBearerAuth()
@Controller('support-tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ticket de soporte' })
  createTicket(
    @CurrentUser() user: CurrentUserData,
    @Body() data: CreateTicketDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden crear tickets de soporte');
    }
    return this.supportService.createTicket(user.tenantId, user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets del tenant actual' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getUserTickets(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden ver tickets');
    }
    return this.supportService.getUserTickets(
      user.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un ticket (usuario)' })
  getUserTicketById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de una empresa pueden ver tickets');
    }
    return this.supportService.getUserTicketById(user.tenantId, id, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Agregar comentario a un ticket (usuario)' })
  addUserComment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de una empresa pueden comentar tickets');
    }
    return this.supportService.addUserComment(user.tenantId, id, user.id, data);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Subir archivo adjunto a un ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: ticketFileStorage, limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAttachment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de una empresa pueden adjuntar archivos');
    }
    if (!file) {
      throw new BadRequestException('No se proporcionó un archivo');
    }
    return this.supportService.addAttachment(id, user.id, user.tenantId, {
      fileName: file.originalname,
      fileUrl: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Listar archivos adjuntos de un ticket' })
  getAttachments(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de una empresa pueden ver archivos');
    }
    return this.supportService.getAttachments(id, user.tenantId);
  }

  @Get('attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Descargar archivo adjunto' })
  async downloadAttachment(
    @CurrentUser() user: CurrentUserData,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de una empresa pueden descargar archivos');
    }
    const attachment = await this.supportService.getAttachmentById(attachmentId, user.tenantId);
    const filePath = join(UPLOADS_DIR, attachment.fileUrl);
    res.download(filePath, attachment.fileName);
  }
}

// ============ ADMIN ENDPOINTS ============
@ApiTags('admin-support-tickets')
@ApiBearerAuth()
@Controller('admin/support-tickets')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los tickets (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.getAllTickets({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      priority,
      assignedToId,
      tenantId,
      type,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas de tickets (Admin)' })
  getTicketStats() {
    return this.supportService.getTicketStats();
  }

  @Get('admins')
  @ApiOperation({ summary: 'Obtener lista de super admins para asignacion' })
  getSuperAdmins() {
    return this.supportService.getSuperAdmins();
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener tickets de un tenant especifico' })
  @ApiQuery({ name: 'limit', required: false })
  getTicketsByTenant(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTicketsByTenant(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un ticket (Admin)' })
  getAdminTicketById(@Param('id') id: string) {
    return this.supportService.getAdminTicketById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ticket (estado, prioridad, asignacion)' })
  updateTicket(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() data: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(id, user.id, data);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Agregar comentario a un ticket (Admin)' })
  addAdminComment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ) {
    return this.supportService.addAdminComment(id, user.id, data);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Subir archivo adjunto a un ticket (Admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: ticketFileStorage, limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAttachment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó un archivo');
    }
    return this.supportService.addAttachment(id, user.id, null, {
      fileName: file.originalname,
      fileUrl: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Listar archivos adjuntos de un ticket (Admin)' })
  getAttachments(@Param('id') id: string) {
    return this.supportService.getAttachments(id, null);
  }

  @Get('attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Descargar archivo adjunto' })
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const attachment = await this.supportService.getAttachmentById(attachmentId, null);
    const filePath = join(UPLOADS_DIR, attachment.fileUrl);
    res.download(filePath, attachment.fileName);
  }
}
