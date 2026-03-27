'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_URL =
  'https://ragsaas-api-dev.whitewater-60ca8851.eastus2.azurecontainerapps.io/widget/facturobot/script.js';

/**
 * The Agent Nimo script creates a button and iframe appended to document.body.
 * It uses style.cssText so we match via cssText substring.
 * We keep refs to avoid re-querying the DOM on every toggle.
 */
let nimoButton: HTMLElement | null = null;
let nimoIframe: HTMLIFrameElement | null = null;
let scriptLoaded = false;
let iframeOpen = false;

function findNimoElements() {
  if (nimoButton && nimoIframe) return;

  // The script appends button + iframe directly to body with background:#4F46E5
  const children = Array.from(document.body.children);
  for (const el of children) {
    if (el.tagName === 'BUTTON' && (el as HTMLElement).style.cssText.includes('#4F46E5')) {
      nimoButton = el as HTMLElement;
    }
    if (el.tagName === 'IFRAME') {
      const iframe = el as HTMLIFrameElement;
      if (iframe.src.includes('ragsaas') || iframe.src.includes('facturobot')) {
        nimoIframe = iframe;
      }
    }
  }
}

/** Toggle the Agent Nimo chat panel. */
export function toggleChat() {
  findNimoElements();

  if (nimoIframe) {
    iframeOpen = !iframeOpen;
    nimoIframe.style.display = iframeOpen ? 'block' : 'none';
    return;
  }

  // Fallback: click the hidden button
  if (nimoButton) {
    nimoButton.click();
    return;
  }

  console.warn('[ChatWidget] Agent Nimo elements not found');
}

export function ChatWidget() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hideDefaultButton = () => {
      findNimoElements();
      if (nimoButton) {
        nimoButton.style.display = 'none';
        return true;
      }
      return false;
    };

    const init = () => {
      // Don't load twice (the script itself guards with __ragsaasLoaded)
      if (scriptLoaded) {
        hideDefaultButton();
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        scriptLoaded = true;
        if (cancelled) return;

        // The script appends elements synchronously in its IIFE,
        // but give a tick just in case
        requestAnimationFrame(() => {
          if (!hideDefaultButton()) {
            observerRef.current = new MutationObserver(() => {
              if (hideDefaultButton()) {
                observerRef.current?.disconnect();
                observerRef.current = null;
              }
            });
            observerRef.current.observe(document.body, { childList: true });
          }
        });
      };
      script.onerror = () => {
        console.warn('[ChatWidget] Failed to load Agent Nimo script');
      };
      document.body.appendChild(script);
    };

    init();

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
    };
  }, []);

  return null;
}
