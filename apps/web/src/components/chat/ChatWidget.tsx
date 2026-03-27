'use client';

import { useRef, useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import { useChatWidget, type BubblePosition } from './use-chat-widget';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatWelcome } from './ChatWelcome';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const BUBBLE_SIZE = 56;
const EDGE_MARGIN = 16;

const POSITION_STYLES: Record<BubblePosition, { bottom?: number; top?: number; left?: number; right?: number }> = {
  'bottom-right': { bottom: EDGE_MARGIN, right: EDGE_MARGIN },
  'bottom-left': { bottom: EDGE_MARGIN, left: EDGE_MARGIN },
  'top-right': { top: EDGE_MARGIN, right: EDGE_MARGIN },
  'top-left': { top: EDGE_MARGIN, left: EDGE_MARGIN },
};

const PANEL_POSITION: Record<BubblePosition, string> = {
  'bottom-right': 'bottom-16 right-0',
  'bottom-left': 'bottom-16 left-0',
  'top-right': 'top-16 right-0',
  'top-left': 'top-16 left-0',
};

function getClosestCorner(x: number, y: number): BubblePosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isRight = x > vw / 2;
  const isBottom = y > vh / 2;

  if (isBottom && isRight) return 'bottom-right';
  if (isBottom && !isRight) return 'bottom-left';
  if (!isBottom && isRight) return 'top-right';
  return 'top-left';
}

export function ChatWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    position,
    toggleChat,
    setPosition,
    sendMessage,
    sendFeedback,
    hasMessages,
    hasSeenWelcome,
  } = useChatWidget();

  const { user } = useAppStore();
  const showWelcome = !hasSeenWelcome && !hasMessages;

  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((_: unknown, info: PanInfo) => {
    dragStartPos.current = { x: info.point.x, y: info.point.y };
    isDragging.current = false;
  }, []);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    const dx = Math.abs(info.point.x - dragStartPos.current.x);
    const dy = Math.abs(info.point.y - dragStartPos.current.y);
    if (dx > 5 || dy > 5) {
      isDragging.current = true;
    }
  }, []);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (isDragging.current) {
      const corner = getClosestCorner(info.point.x, info.point.y);
      setPosition(corner);
    }
    // Small delay to prevent click from firing after drag
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  }, [setPosition]);

  const handleBubbleClick = useCallback(() => {
    if (!isDragging.current) {
      toggleChat();
    }
  }, [toggleChat]);

  const posStyle = POSITION_STYLES[position];

  return (
    <>
      {/* Bubble */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        animate={posStyle}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed z-50"
        style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
      >
        <button
          onClick={handleBubbleClick}
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center',
            'bg-facturo-violet-600 hover:bg-facturo-violet-700 text-white',
            'shadow-lg hover:shadow-xl transition-shadow',
            'cursor-grab active:cursor-grabbing',
            'group relative',
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
          {/* Drag grip indicator */}
          <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-60 transition-opacity">
            <GripVertical className="h-3.5 w-3.5 text-white" />
          </span>
        </button>
      </motion.div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={toggleChat}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'fixed z-50 flex flex-col bg-background border border-border shadow-2xl',
                // Mobile: fullscreen
                'inset-2 rounded-2xl md:inset-auto',
                // Desktop: positioned relative to bubble
                `md:w-[400px] md:h-[520px] md:rounded-2xl`,
                `md:${PANEL_POSITION[position]}`,
                // Position offset for desktop
                position.includes('right') ? 'md:right-4' : 'md:left-4',
                position.includes('bottom') ? 'md:bottom-20' : 'md:top-20',
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-facturo-violet-100 dark:bg-facturo-violet-900/40 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-facturo-violet-600 dark:text-facturo-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Asistente Facturo</h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">Powered by AgentNimo</p>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body: Welcome screen OR Messages */}
              <AnimatePresence mode="wait">
                {showWelcome ? (
                  <ChatWelcome
                    key="welcome"
                    userName={user?.name?.split(' ')[0]}
                    onAction={sendMessage}
                  />
                ) : (
                  <ChatMessages
                    key="messages"
                    messages={messages}
                    isLoading={isLoading}
                    onFeedback={sendFeedback}
                  />
                )}
              </AnimatePresence>

              {/* Footer: suggestions + input */}
              <div className="border-t border-border/50 p-3 space-y-2">
                {!hasMessages && hasSeenWelcome && (
                  <ChatSuggestions onSelect={sendMessage} />
                )}
                <ChatInput
                  onSend={sendMessage}
                  isLoading={isLoading}
                  autoFocus={isOpen}
                />
                <p className="text-[10px] text-center text-muted-foreground">
                  Ctrl+/ para abrir · Esc para cerrar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
