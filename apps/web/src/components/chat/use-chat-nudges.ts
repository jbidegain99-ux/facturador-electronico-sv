'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface NudgeState {
  isActive: boolean;
  type: 'pulse' | 'tooltip';
  message?: string;
  trigger: string;
}

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const TOOLTIP_AUTO_DISMISS_MS = 8_000;
const TIME_ON_PAGE_MS = 120_000; // 2 minutes
const EMPTY_STATE_DELAY_MS = 3_000;
const VISITED_MODULES_KEY = 'facturo-visited-modules';

// --- Route-based message maps ---

const TIME_NUDGE_ROUTES: Record<string, string> = {
  '/facturacion/nueva': '¿Necesitas ayuda creando tu factura?',
  '/cotizaciones/nueva': '¿Te guío para crear la cotización?',
  '/configuracion/hacienda': '¿Necesitas ayuda con la configuración de Hacienda?',
};

const FIRST_VISIT_MESSAGES: Record<string, string> = {
  '/facturacion': 'Primera vez aquí. ¿Te explico cómo funciona la facturación?',
  '/cotizaciones': '¿Quieres que te guíe por el módulo de cotizaciones?',
  '/contabilidad': 'La contabilidad puede ser compleja. ¿Te ayudo a comenzar?',
  '/clientes': '¿Es tu primera vez aquí? Puedo ayudarte con clientes.',
  '/reportes': '¿Necesitas ayuda con los reportes?',
  '/catalogo': '¿Te ayudo a configurar tu catálogo de productos?',
  '/configuracion': '¿Necesitas ayuda con la configuración?',
};

const EMPTY_STATE_MESSAGES: Record<string, string> = {
  '/facturacion/facturas': '¿Quieres crear tu primera factura? Te guío.',
  '/clientes': 'Aún no tienes clientes. ¿Te ayudo a agregar el primero?',
  '/cotizaciones': '¿Quieres crear tu primera cotización?',
  '/catalogo': '¿Te ayudo a agregar tu primer producto?',
};

function getModuleRoot(pathname: string): string {
  // "/facturacion/nueva" → "/facturacion"
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : pathname;
}

function loadVisitedModules(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(VISITED_MODULES_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveVisitedModule(mod: string) {
  const visited = loadVisitedModules();
  visited.add(mod);
  localStorage.setItem(VISITED_MODULES_KEY, JSON.stringify(Array.from(visited)));
}

function isDismissedThisSession(trigger: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`facturo-nudge-dismissed-${trigger}`) === 'true';
}

function dismissInSession(trigger: string) {
  sessionStorage.setItem(`facturo-nudge-dismissed-${trigger}`, 'true');
}

export function useChatNudges(chatIsOpen: boolean) {
  const pathname = usePathname();
  const [nudge, setNudge] = useState<NudgeState>({ isActive: false, type: 'pulse', trigger: '' });
  const cooldownUntil = useRef(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout>>();

  const isOnCooldown = () => Date.now() < cooldownUntil.current;

  const activateNudge = useCallback((type: 'pulse' | 'tooltip', trigger: string, message?: string) => {
    if (isOnCooldown()) return;
    if (isDismissedThisSession(trigger)) return;

    setNudge({ isActive: true, type, message, trigger });

    // Auto-dismiss tooltip after 8s
    clearTimeout(autoDismissTimer.current);
    const timeout = type === 'tooltip' ? TOOLTIP_AUTO_DISMISS_MS : 30_000;
    autoDismissTimer.current = setTimeout(() => {
      setNudge((prev) => prev.trigger === trigger ? { isActive: false, type: 'pulse', trigger: '' } : prev);
    }, timeout);
  }, []);

  const dismissNudge = useCallback(() => {
    if (nudge.trigger) {
      dismissInSession(nudge.trigger);
    }
    setNudge({ isActive: false, type: 'pulse', trigger: '' });
    cooldownUntil.current = Date.now() + COOLDOWN_MS;
    clearTimeout(autoDismissTimer.current);
  }, [nudge.trigger]);

  // Hide nudge when chat opens
  useEffect(() => {
    if (chatIsOpen && nudge.isActive) {
      setNudge({ isActive: false, type: 'pulse', trigger: '' });
      clearTimeout(autoDismissTimer.current);
    }
  }, [chatIsOpen, nudge.isActive]);

  // Reset on route change
  useEffect(() => {
    setNudge({ isActive: false, type: 'pulse', trigger: '' });
    clearTimeout(autoDismissTimer.current);
  }, [pathname]);

  // --- Trigger 1: Time on page (120s) ---
  useEffect(() => {
    if (chatIsOpen) return;

    // Only on form/action pages
    const matchedRoute = Object.keys(TIME_NUDGE_ROUTES).find((r) => pathname.startsWith(r));
    if (!matchedRoute) return;

    const timer = setTimeout(() => {
      if (!chatIsOpen) {
        activateNudge('tooltip', `time-${matchedRoute}`, TIME_NUDGE_ROUTES[matchedRoute]);
      }
    }, TIME_ON_PAGE_MS);

    return () => clearTimeout(timer);
  }, [pathname, chatIsOpen, activateNudge]);

  // --- Trigger 2: Validation errors (DOM observer) ---
  useEffect(() => {
    if (chatIsOpen) return;

    let errorCount = 0;
    const trigger = `errors-${pathname}`;

    const checkErrors = () => {
      const errorElements = document.querySelectorAll('.text-destructive');
      // Filter out small decorative elements like asterisks
      const realErrors = Array.from(errorElements).filter(
        (el) => el.textContent && el.textContent.length > 3,
      );
      if (realErrors.length >= 3 && realErrors.length > errorCount) {
        activateNudge('tooltip', trigger, 'Parece que el formulario tiene errores. ¿Puedo ayudarte?');
      }
      errorCount = realErrors.length;
    };

    const observer = new MutationObserver(() => {
      checkErrors();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [pathname, chatIsOpen, activateNudge]);

  // --- Trigger 3: First module visit ---
  useEffect(() => {
    if (chatIsOpen) return;

    const moduleRoot = getModuleRoot(pathname);
    if (!FIRST_VISIT_MESSAGES[moduleRoot]) return;

    const visited = loadVisitedModules();
    if (visited.has(moduleRoot)) return;

    // Mark as visited immediately
    saveVisitedModule(moduleRoot);

    // Small delay to not overlap with page load
    const timer = setTimeout(() => {
      if (!chatIsOpen) {
        activateNudge('tooltip', `first-visit-${moduleRoot}`, FIRST_VISIT_MESSAGES[moduleRoot]);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname, chatIsOpen, activateNudge]);

  // --- Trigger 4: Empty states (DOM check) ---
  useEffect(() => {
    if (chatIsOpen) return;

    const matchedRoute = Object.keys(EMPTY_STATE_MESSAGES).find((r) => pathname.startsWith(r));
    if (!matchedRoute) return;

    const timer = setTimeout(() => {
      if (chatIsOpen) return;

      // Check for empty state indicators in the DOM
      const emptyTexts = ['No hay', 'Sin resultados', 'no se encontraron', 'No tienes', 'está vacía', 'Sin favoritos'];
      const allText = document.querySelector('main')?.textContent || '';
      const hasEmpty = emptyTexts.some((t) => allText.toLowerCase().includes(t.toLowerCase()));

      // Also check if there are 0 table rows (common in list pages)
      const tableRows = document.querySelectorAll('main tbody tr');
      const tableExists = document.querySelector('main table') !== null;
      const emptyTable = tableExists && tableRows.length === 0;

      if (hasEmpty || emptyTable) {
        activateNudge('tooltip', `empty-${matchedRoute}`, EMPTY_STATE_MESSAGES[matchedRoute]);
      }
    }, EMPTY_STATE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [pathname, chatIsOpen, activateNudge]);

  return { nudge, dismissNudge };
}
