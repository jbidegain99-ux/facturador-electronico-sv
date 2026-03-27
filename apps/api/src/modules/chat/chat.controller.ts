import {
  Controller,
  Post,
  Body,
  Res,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto, ChatFeedbackDto } from './chat.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('chat')
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Enviar mensaje al asistente AI (JSON)' })
  async sendMessage(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendMessageDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.chatService.sendMessage(dto, user.tenantId, user.id);
  }

  @Post('message/stream')
  @ApiOperation({ summary: 'Enviar mensaje al asistente AI (SSE streaming)' })
  async streamMessage(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.chatService.streamMessage(dto, user.tenantId, user.id, res);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Enviar feedback de respuesta del asistente' })
  async saveFeedback(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChatFeedbackDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.chatService.saveFeedback(dto, user.tenantId, user.id);
  }
}
