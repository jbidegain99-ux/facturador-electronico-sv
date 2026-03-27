'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, isLoading, autoFocus }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu pregunta..."
        disabled={isLoading}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-lg border border-facturo-violet-200 dark:border-facturo-violet-800 bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-facturo-violet-500/40 focus:border-facturo-violet-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'max-h-24',
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className={cn(
          'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
          'bg-facturo-violet-600 text-white hover:bg-facturo-violet-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
