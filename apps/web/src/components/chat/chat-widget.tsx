'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

const SCRIPT_URL =
  'https://ragsaas-api-dev.whitewater-60ca8851.eastus2.azurecontainerapps.io/widget/facturobot/script.js';

let scriptLoaded = false;
let scriptLoading = false;

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Agent Nimo script'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Find the widget's default trigger button injected by the Agent Nimo script.
 * The script creates a 56px round button fixed at bottom:20px right:20px.
 */
function findWidgetButton(): HTMLElement | null {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find((btn) => {
    const s = btn.style;
    return (
      s.position === 'fixed' &&
      s.bottom === '20px' &&
      s.right === '20px' &&
      s.borderRadius === '50%'
    );
  }) ?? null;
}

/**
 * Find the widget iframe injected by the Agent Nimo script.
 */
function findWidgetIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll('iframe'));
  return iframes.find((iframe) => {
    const s = iframe.style;
    return (
      s.position === 'fixed' &&
      s.right === '20px' &&
      s.bottom === '80px'
    );
  }) ?? null;
}

/** Toggle the Agent Nimo chat panel by clicking its hidden trigger button. */
export function toggleChat() {
  const btn = findWidgetButton();
  if (btn) {
    btn.click();
    return;
  }
  console.warn('[ChatWidget] Agent Nimo button not found');
}

export function ChatWidget() {
  const { theme } = useAppStore();
  const observerRef = useRef<MutationObserver | null>(null);

  // Load script and hide its default floating button
  useEffect(() => {
    let cancelled = false;

    const hideDefaultButton = () => {
      const btn = findWidgetButton();
      if (btn) {
        btn.style.display = 'none';
        return true;
      }
      return false;
    };

    const init = async () => {
      try {
        await loadScript();
        if (cancelled) return;

        // The script may append the button asynchronously — watch for it
        if (!hideDefaultButton()) {
          observerRef.current = new MutationObserver(() => {
            if (hideDefaultButton()) {
              observerRef.current?.disconnect();
              observerRef.current = null;
            }
          });
          observerRef.current.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
      } catch (err) {
        console.warn('[ChatWidget] Failed to load Agent Nimo:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
    };
  }, []);

  // Sync theme with widget iframe
  useEffect(() => {
    if (!scriptLoaded) return;

    const iframe = findWidgetIframe();
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'THEME_CHANGE', theme }, '*');
    }
  }, [theme]);

  return null;
}
