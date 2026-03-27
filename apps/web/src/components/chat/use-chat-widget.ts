'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type BubblePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const POSITION_KEY = 'facturo-chat-position';
const WELCOME_KEY = 'facturo-chat-welcome-seen';

function loadPosition(): BubblePosition {
  if (typeof window === 'undefined') return 'bottom-right';
  return (localStorage.getItem(POSITION_KEY) as BubblePosition) || 'bottom-right';
}

function loadWelcomeSeen(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WELCOME_KEY) === 'true';
}

export function useChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [position, setPositionState] = useState<BubblePosition>(loadPosition);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(loadWelcomeSeen);
  const abortRef = useRef<AbortController | null>(null);

  const dismissWelcome = useCallback(() => {
    setHasSeenWelcome(true);
    localStorage.setItem(WELCOME_KEY, 'true');
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const setPosition = useCallback((pos: BubblePosition) => {
    setPositionState(pos);
    localStorage.setItem(POSITION_KEY, pos);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!hasSeenWelcome) {
      dismissWelcome();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Cancel any pending request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionId || undefined,
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${res.status}`);
      }

      const data: { answer: string; sessionId: string } = await res.json();

      setSessionId(data.sessionId);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al procesar tu pregunta. Intenta de nuevo.';

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, hasSeenWelcome, dismissWelcome]);

  const sendFeedback = useCallback(async (
    messageContent: string,
    botResponse: string,
    rating: 'up' | 'down',
    feedbackText?: string,
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageContent,
            botResponse,
            rating,
            feedbackText,
            pageRoute: window.location.pathname,
          }),
        },
      );
    } catch {
      // Fire-and-forget
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleChat();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat]);

  // Listen for header toggle event
  useEffect(() => {
    const handleToggle = () => toggleChat();
    window.addEventListener('facturo-chat-toggle', handleToggle);
    return () => window.removeEventListener('facturo-chat-toggle', handleToggle);
  }, [toggleChat]);

  return {
    messages,
    isOpen,
    isLoading,
    sessionId,
    position,
    toggleChat,
    setPosition,
    sendMessage,
    sendFeedback,
    hasMessages: messages.length > 0,
    hasSeenWelcome,
    dismissWelcome,
  };
}
