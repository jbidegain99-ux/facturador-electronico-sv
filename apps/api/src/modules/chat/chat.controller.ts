import {
  Controller,
  Post,
  Body,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Enviar mensaje al asistente AI' })
  async sendMessage(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendMessageDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return this.chatService.sendMessage(dto, user.tenantId, user.id);
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
