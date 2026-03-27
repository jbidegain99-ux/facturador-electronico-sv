'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatFeedback } from './ChatFeedback';
import { cn } from '@/lib/utils';
import type { ChatMessage } from './use-chat-widget';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onFeedback: (messageContent: string, botResponse: string, rating: 'up' | 'down', feedbackText?: string) => void;
}

export function ChatMessages({ messages, isLoading, onFeedback }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm text-muted-foreground">
            ¡Hola! Soy el asistente de Facturo.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pregúntame lo que necesites.
          </p>
        </div>
      </div>
    );
  }

  // Find the user message that preceded a bot message (for feedback context)
  const getUserMessageBefore = (index: number): string => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5',
                msg.role === 'user'
                  ? 'bg-facturo-violet-600 text-white rounded-br-md'
                  : 'bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-bl-md',
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-a:text-facturo-violet-600 dark:prose-a:text-facturo-violet-400 prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.role === 'assistant' && (
                <ChatFeedback
                  onFeedback={(rating, feedbackText) =>
                    onFeedback(getUserMessageBefore(index), msg.content, rating, feedbackText)
                  }
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-facturo-violet-500 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-facturo-violet-500 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-facturo-violet-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
