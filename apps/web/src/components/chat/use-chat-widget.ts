'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  /** For system messages with action buttons */
  actions?: Array<{ label: string; key: string }>;
}

export type BubblePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type ChatMode = 'bubble' | 'panel' | 'sidebar';

const POSITION_KEY = 'facturo-chat-position';
const WELCOME_KEY = 'facturo-chat-welcome-seen';
const MODE_PREF_KEY = 'facturo-chat-mode-pref';

function loadPosition(): BubblePosition {
  if (typeof window === 'undefined') return 'bottom-right';
  return (localStorage.getItem(POSITION_KEY) as BubblePosition) || 'bottom-right';
}

function loadWelcomeSeen(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WELCOME_KEY) === 'true';
}

function loadModePref(): 'panel' | 'sidebar' {
  if (typeof window === 'undefined') return 'panel';
  return (localStorage.getItem(MODE_PREF_KEY) as 'panel' | 'sidebar') || 'panel';
}

export function useChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setModeState] = useState<ChatMode>('bubble');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [position, setPositionState] = useState<BubblePosition>(loadPosition);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(loadWelcomeSeen);
  const abortRef = useRef<AbortController | null>(null);
  const setChatSidebarOpen = useAppStore((s) => s.setChatSidebarOpen);

  // Sync sidebar state to store for layout margin
  useEffect(() => {
    setChatSidebarOpen(mode === 'sidebar');
  }, [mode, setChatSidebarOpen]);

  const setMode = useCallback((newMode: ChatMode) => {
    setModeState(newMode);
    if (newMode === 'panel' || newMode === 'sidebar') {
      localStorage.setItem(MODE_PREF_KEY, newMode);
    }
  }, []);

  const isOpen = mode !== 'bubble';

  const openChat = useCallback(() => {
    const pref = loadModePref();
    setMode(pref);
  }, [setMode]);

  const closeChat = useCallback(() => {
    setMode('bubble');
  }, [setMode]);

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isOpen, openChat, closeChat]);

  const openSidebar = useCallback(() => {
    setMode('sidebar');
  }, [setMode]);

  const closeSidebar = useCallback(() => {
    setMode('panel');
  }, [setMode]);

  const dismissWelcome = useCallback(() => {
    setHasSeenWelcome(true);
    localStorage.setItem(WELCOME_KEY, 'true');
  }, []);

  const setPosition = useCallback((pos: BubblePosition) => {
    setPositionState(pos);
    localStorage.setItem(POSITION_KEY, pos);
  }, []);

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const updateMessageContent = useCallback((msgId: string, content: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content } : m));
  }, []);

  /** JSON fallback (original endpoint) */
  const sendMessageJson = useCallback(async (
    text: string,
    botMsgId: string,
    authToken: string,
    signal: AbortSignal,
  ) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ message: text, sessionId: sessionId || undefined }),
        signal,
      },
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `Error ${res.status}`);
    }

    const data: { answer: string; sessionId: string } = await res.json();
    setSessionId(data.sessionId);
    updateMessageContent(botMsgId, data.answer);
  }, [sessionId, updateMessageContent]);

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

    const botMsgId = `bot-${Date.now()}`;
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsLoading(true);
    setStreamingMessageId(botMsgId);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) throw new Error('No auth token');

      // Try streaming first
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/message/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ message: trimmed, sessionId: sessionId || undefined }),
          signal: controller.signal,
        },
      );

      if (!res.ok || !res.body) {
        // Fallback to JSON
        await sendMessageJson(trimmed, botMsgId, authToken, controller.signal);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('data: ')) continue;
            const jsonStr = trimmedLine.slice(6);

            try {
              const event = JSON.parse(jsonStr);

              if (event.token !== undefined) {
                accumulated += event.token;
                updateMessageContent(botMsgId, accumulated);
              }

              if (event.done) {
                setSessionId(event.sessionId);
              }

              if (event.error) {
                if (accumulated) {
                  accumulated += '\n\n*(La respuesta se interrumpió)*';
                  updateMessageContent(botMsgId, accumulated);
                } else {
                  updateMessageContent(botMsgId, 'Error al procesar tu pregunta. Intenta de nuevo.');
                }
              }
            } catch {
              // Partial JSON, skip
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // If no content arrived via stream, fallback
      if (!accumulated) {
        await sendMessageJson(trimmed, botMsgId, authToken, controller.signal);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al procesar tu pregunta. Intenta de nuevo.';

      updateMessageContent(botMsgId, errorMessage);
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [sessionId, hasSeenWelcome, dismissWelcome, sendMessageJson, updateMessageContent]);

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

  // --- Support escalation ---
  const [isEscalating, setIsEscalating] = useState(false);

  const requestEscalation = useCallback(() => {
    if (messages.length === 0) {
      // No conversation — navigate directly
      window.location.href = '/soporte';
      return;
    }

    // Show inline confirmation
    const confirmMsg: ChatMessage = {
      id: `system-confirm-${Date.now()}`,
      role: 'system',
      content: '¿Deseas crear un ticket de soporte con esta conversación?',
      timestamp: new Date(),
      actions: [
        { label: 'Sí, crear ticket', key: 'confirm-escalation' },
        { label: 'Cancelar', key: 'cancel-escalation' },
      ],
    };
    setMessages((prev) => [...prev, confirmMsg]);
  }, [messages.length]);

  const handleSystemAction = useCallback(async (actionKey: string) => {
    // Remove the system message with actions
    setMessages((prev) => prev.filter((m) => !m.actions));

    if (actionKey === 'cancel-escalation') return;

    if (actionKey === 'confirm-escalation') {
      setIsEscalating(true);

      const transcript = messages
        .filter((m) => m.role !== 'system')
        .map((msg) => {
          const role = msg.role === 'user' ? 'Usuario' : 'Asistente Facturo';
          const time = new Date(msg.timestamp).toLocaleTimeString('es-SV');
          return `[${time}] ${role}: ${msg.content}`;
        })
        .join('\n\n');

      const description = `## Conversación con Asistente AI\n\nEste ticket fue creado automáticamente desde el chat de asistencia AI porque el usuario necesitó ayuda humana.\n\n### Transcript de la conversación:\n\n${transcript}\n\n---\n*Ticket generado automáticamente por el Asistente Facturo*`;

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/support-tickets`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: 'GENERAL',
              subject: `Escalación desde chat AI — ${new Date().toLocaleDateString('es-SV')}`,
              description,
              priority: 'MEDIUM',
              metadata: JSON.stringify({
                source: 'chat-escalation',
                sessionId,
                pageRoute: typeof window !== 'undefined' ? window.location.pathname : '',
                messageCount: messages.filter((m) => m.role !== 'system').length,
              }),
            }),
          },
        );

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const successMsg: ChatMessage = {
          id: `system-success-${Date.now()}`,
          role: 'system',
          content: 'Ticket creado exitosamente. Te estoy redirigiendo a soporte...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMsg]);

        setTimeout(() => {
          setMode('bubble');
          window.location.href = '/soporte';
        }, 1500);
      } catch {
        const errorMsg: ChatMessage = {
          id: `system-error-${Date.now()}`,
          role: 'system',
          content: 'No se pudo crear el ticket automáticamente. Te redirijo a soporte...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);

        setTimeout(() => {
          window.location.href = '/soporte';
        }, 1500);
      } finally {
        setIsEscalating(false);
      }
    }
  }, [messages, sessionId, setMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleChat();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat, closeChat]);

  // Listen for header toggle event
  useEffect(() => {
    const handleToggle = () => toggleChat();
    window.addEventListener('facturo-chat-toggle', handleToggle);
    return () => window.removeEventListener('facturo-chat-toggle', handleToggle);
  }, [toggleChat]);

  return {
    messages,
    mode,
    isOpen,
    isLoading,
    sessionId,
    position,
    toggleChat,
    openChat,
    closeChat,
    openSidebar,
    closeSidebar,
    setPosition,
    sendMessage,
    sendFeedback,
    hasMessages: messages.length > 0,
    hasSeenWelcome,
    dismissWelcome,
    requestEscalation,
    handleSystemAction,
    isEscalating,
    streamingMessageId,
  };
}
