'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatFeedback } from './ChatFeedback';
import { cn } from '@/lib/utils';
import type { ChatMessage } from './use-chat-widget';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onFeedback: (messageContent: string, botResponse: string, rating: 'up' | 'down', feedbackText?: string) => void;
  onSystemAction?: (key: string) => void;
  streamingMessageId?: string | null;
}

export function ChatMessages({ messages, isLoading, onFeedback, onSystemAction, streamingMessageId }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
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
        {messages.map((msg, index) => {
          // System messages (confirmations, status)
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-[90%] rounded-xl px-4 py-2.5 bg-facturo-violet-50 dark:bg-facturo-violet-950/30 border border-facturo-violet-200 dark:border-facturo-violet-800/50">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-facturo-violet-600 dark:text-facturo-violet-400" />
                    <div>
                      <p className="text-sm text-facturo-violet-700 dark:text-facturo-violet-300">{msg.content}</p>
                      {msg.actions && onSystemAction && (
                        <div className="flex gap-2 mt-2">
                          {msg.actions.map((action) => (
                            <button
                              key={action.key}
                              onClick={() => onSystemAction(action.key)}
                              className={cn(
                                'text-xs px-3 py-1.5 rounded-lg transition-colors',
                                action.key.includes('confirm')
                                  ? 'bg-facturo-violet-600 text-white hover:bg-facturo-violet-700'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                              )}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const isStreaming = msg.id === streamingMessageId;

          return (
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
                  <div className={cn(
                    'prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-a:text-facturo-violet-600 dark:prose-a:text-facturo-violet-400 prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs',
                    isStreaming && 'streaming-cursor',
                  )}>
                    {msg.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : isStreaming ? (
                      <span className="text-muted-foreground text-sm">...</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === 'assistant' && !isStreaming && msg.content && (
                  <ChatFeedback
                    onFeedback={(rating, feedbackText) =>
                      onFeedback(getUserMessageBefore(index), msg.content, rating, feedbackText)
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
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
