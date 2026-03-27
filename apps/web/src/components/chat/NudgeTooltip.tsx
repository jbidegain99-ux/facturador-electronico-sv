'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { BubblePosition } from './use-chat-widget';
import { cn } from '@/lib/utils';

interface NudgeTooltipProps {
  message: string;
  position: BubblePosition;
  onDismiss: () => void;
  onClick: () => void;
}

export function NudgeTooltip({ message, position, onDismiss, onClick }: NudgeTooltipProps) {
  const isBottom = position.includes('bottom');
  const isRight = position.includes('right');

  return (
    <motion.div
      initial={{ opacity: 0, y: isBottom ? 6 : -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'absolute z-50 max-w-[220px]',
        // Position relative to bubble
        isBottom ? 'bottom-full mb-3' : 'top-full mt-3',
        isRight ? 'right-0' : 'left-0',
      )}
    >
      <div
        className="relative bg-background border border-border shadow-lg rounded-xl px-3.5 py-2.5 cursor-pointer group"
        onClick={onClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <X className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
        <p className="text-[13px] text-foreground leading-snug pr-2 group-hover:text-facturo-violet-600 dark:group-hover:text-facturo-violet-400 transition-colors">
          {message}
        </p>
        {/* Caret */}
        <div
          className={cn(
            'absolute w-2.5 h-2.5 bg-background border-border rotate-45',
            isBottom
              ? 'bottom-[-5px] border-b border-r'
              : 'top-[-5px] border-t border-l',
            isRight ? 'right-5' : 'left-5',
          )}
        />
      </div>
    </motion.div>
  );
}
