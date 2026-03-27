import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto, ChatFeedbackDto, NimoBotRequest, NimoBotResponse } from './chat.dto';
import { firstValueFrom } from 'rxjs';
import { classifyIntent } from './chat-intent';
import { ChatDataService } from './chat-data.service';
import type { Response } from 'express';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly botApiUrl: string;
  private readonly botApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatDataService: ChatDataService,
  ) {
    this.botApiUrl = this.configService.get<string>('NIMO_BOT_API_URL') ?? '';
    this.botApiKey = this.configService.get<string>('NIMO_BOT_API_KEY') ?? '';

    if (!this.botApiUrl || !this.botApiKey) {
      this.logger.warn('NIMO_BOT_API_URL or NIMO_BOT_API_KEY not configured. Chat will not work.');
    }
  }

  async sendMessage(
    dto: SendMessageDto,
    tenantId: string,
    userId: string,
  ): Promise<{ answer: string; sessionId: string }> {
    if (!this.botApiUrl || !this.botApiKey) {
      throw new HttpException(
        'Chat service not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      // Classify intent and fetch tenant data if applicable
      const intent = classifyIntent(dto.message);
      let tenantContext: Array<{ label: string; data: string }> | undefined;

      this.logger.log(
        `[DEBUG] classifyIntent("${dto.message.substring(0, 80)}") => ${intent ? `${intent.intent} [${intent.timeRange.from.toISOString()} - ${intent.timeRange.to.toISOString()}]` : 'null (no data intent)'}`,
      );

      if (intent) {
        try {
          tenantContext = await this.chatDataService.fetchData(intent, tenantId);
          this.logger.log(
            `[DEBUG] tenantContext for ${intent.intent}: ${JSON.stringify(tenantContext).substring(0, 500)}`,
          );
        } catch (dataError: unknown) {
          const dErr = dataError as { message?: string };
          this.logger.warn(
            `Failed to fetch tenant data for intent ${intent.intent}: ${dErr.message}`,
          );
          // Graceful degradation: send without data
        }
      }

      const botRequest: NimoBotRequest = {
        message: dto.message,
        sessionId: dto.sessionId || undefined,
        tenantContext,
        ragEnabled: true,
        stream: false,
      };

      this.logger.log(
        `Chat request from tenant=${tenantId} user=${userId}: "${dto.message.substring(0, 100)}"`,
      );

      const response = await firstValueFrom(
        this.httpService.post<NimoBotResponse>(this.botApiUrl, botRequest, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.botApiKey,
          },
          timeout: 30000,
        }),
      );

      this.logger.log(
        `Chat response received for tenant=${tenantId}, sessionId=${response.data.sessionId}`,
      );

      return {
        answer: response.data.answer,
        sessionId: response.data.sessionId,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; code?: string; response?: { status?: number } };
      this.logger.error(
        `Chat error for tenant=${tenantId}: ${err.message}`,
        err.stack,
      );

      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        throw new HttpException(
          'El asistente no está disponible en este momento. Por favor intenta de nuevo en unos minutos.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (err.response?.status === 429) {
        throw new HttpException(
          'Demasiadas preguntas. Espera unos segundos antes de preguntar de nuevo.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Error al procesar tu pregunta. Intenta de nuevo.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async streamMessage(
    dto: SendMessageDto,
    tenantId: string,
    userId: string,
    res: Response,
  ): Promise<void> {
    if (!this.botApiUrl || !this.botApiKey) {
      res.status(503).json({ message: 'Chat service not configured' });
      return;
    }

    try {
      // Classify intent and fetch tenant data (sync, before streaming)
      const intent = classifyIntent(dto.message);
      let tenantContext: Array<{ label: string; data: string }> | undefined;

      this.logger.log(
        `[STREAM] classifyIntent("${dto.message.substring(0, 80)}") => ${intent ? intent.intent : 'null'}`,
      );

      if (intent) {
        try {
          tenantContext = await this.chatDataService.fetchData(intent, tenantId);
        } catch (dataError: unknown) {
          const dErr = dataError as { message?: string };
          this.logger.warn(`[STREAM] Failed to fetch tenant data: ${dErr.message}`);
        }
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Connect to Denis with stream: true
      const botRequest: NimoBotRequest = {
        message: dto.message,
        sessionId: dto.sessionId || undefined,
        tenantContext,
        ragEnabled: true,
        stream: true,
      };

      this.logger.log(`[STREAM] Connecting to Denis for tenant=${tenantId} user=${userId}`);

      const denisResponse = await fetch(this.botApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.botApiKey,
        },
        body: JSON.stringify(botRequest),
        signal: AbortSignal.timeout(60000),
      });

      if (!denisResponse.ok || !denisResponse.body) {
        res.write(`data: ${JSON.stringify({ error: `Denis returned ${denisResponse.status}` })}\n\n`);
        res.end();
        return;
      }

      // Pipe SSE tokens from Denis to browser
      const reader = denisResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);

            try {
              const event = JSON.parse(jsonStr);

              if (event.done) {
                res.write(`data: ${JSON.stringify({ done: true, sessionId: event.sessionId })}\n\n`);
              } else if (event.token !== undefined) {
                res.write(`data: ${JSON.stringify({ token: event.token })}\n\n`);
              }
            } catch {
              // Partial JSON chunk, skip
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          try {
            const event = JSON.parse(buffer.trim().slice(6));
            if (event.done) {
              res.write(`data: ${JSON.stringify({ done: true, sessionId: event.sessionId })}\n\n`);
            } else if (event.token !== undefined) {
              res.write(`data: ${JSON.stringify({ token: event.token })}\n\n`);
            }
          } catch {
            // Ignore
          }
        }
      } finally {
        reader.releaseLock();
      }

      res.end();
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(`[STREAM] Error for tenant=${tenantId}: ${err.message}`);

      try {
        if (!res.headersSent) {
          res.status(500).json({ message: 'Streaming error' });
        } else {
          res.write(`data: ${JSON.stringify({ error: err.message || 'Stream interrupted' })}\n\n`);
          res.end();
        }
      } catch {
        // Response already closed
      }
    }
  }

  async saveFeedback(
    dto: ChatFeedbackDto,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.prisma.chatFeedback.create({
        data: {
          tenantId,
          userId,
          messageContent: dto.messageContent.substring(0, 2000),
          botResponse: dto.botResponse.substring(0, 4000),
          rating: dto.rating,
          feedbackText: dto.feedbackText?.substring(0, 500),
          pageRoute: dto.pageRoute?.substring(0, 200),
        },
      });

      this.logger.log(
        `Feedback saved: tenant=${tenantId} rating=${dto.rating}`,
      );

      return { success: true };
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(`Feedback save error: ${err.message}`);
      return { success: false };
    }
  }
}
