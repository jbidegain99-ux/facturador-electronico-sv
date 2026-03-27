'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatFeedbackProps {
  onFeedback: (rating: 'up' | 'down', feedbackText?: string) => void;
}

const NEGATIVE_OPTIONS = ['Incorrecto', 'No relevante', 'Incompleto'];

export function ChatFeedback({ onFeedback }: ChatFeedbackProps) {
  const [submitted, setSubmitted] = useState<'up' | 'down' | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleUp = () => {
    setSubmitted('up');
    setShowOptions(false);
    onFeedback('up');
  };

  const handleDown = () => {
    setSubmitted('down');
    setShowOptions(true);
  };

  const handleOption = (text: string) => {
    setShowOptions(false);
    onFeedback('down', text);
  };

  if (submitted && !showOptions) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-muted-foreground">
          {submitted === 'up' ? '👍' : '👎'} Gracias por tu feedback
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      {!submitted && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleUp}
            className={cn(
              'p-1 rounded hover:bg-facturo-violet-100 dark:hover:bg-facturo-violet-900/30 transition-colors',
              'text-muted-foreground hover:text-facturo-violet-600',
            )}
            title="Buena respuesta"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDown}
            className={cn(
              'p-1 rounded hover:bg-facturo-violet-100 dark:hover:bg-facturo-violet-900/30 transition-colors',
              'text-muted-foreground hover:text-facturo-violet-600',
            )}
            title="Mala respuesta"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {showOptions && (
        <div className="flex flex-wrap gap-1 mt-1">
          {NEGATIVE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleOption(opt)}
              className="text-xs px-2 py-0.5 rounded-full border border-border hover:bg-facturo-violet-100 dark:hover:bg-facturo-violet-900/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
