export interface SendMessageDto {
  message: string;
  sessionId?: string;
  pageRoute?: string;
}

export interface ChatFeedbackDto {
  messageContent: string;
  botResponse: string;
  rating: 'up' | 'down';
  feedbackText?: string;
  pageRoute?: string;
}

export interface NimoBotRequest {
  message: string;
  sessionId?: string;
  tenantContext?: Array<{ label: string; data: string }>;
  ragEnabled: boolean;
  stream: boolean;
}

export interface NimoBotResponse {
  answer: string;
  sessionId: string;
}
