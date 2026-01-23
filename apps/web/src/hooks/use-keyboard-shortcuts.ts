'use client';

import { useEffect, useCallback } from 'react';

type KeyCombo = string; // e.g., 'mod+enter', 'mod+n', 'escape'
type ShortcutHandler = () => void;
type ShortcutMap = Record<KeyCombo, ShortcutHandler>;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * Supports 'mod' as a modifier that maps to Cmd on Mac, Ctrl on Windows/Linux
 *
 * @example
 * useKeyboardShortcuts({
 *   'mod+n': () => createNew(),
 *   'mod+enter': () => submit(),
 *   'mod+s': () => save(),
 *   'escape': () => close(),
 * });
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs/textareas (unless Escape)
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      // Build the key combo string
      const parts: string[] = [];

      // Use 'mod' for platform-independent modifier
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (modKey) parts.push('mod');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');

      // Add the actual key
      let key = event.key.toLowerCase();
      if (key === ' ') key = 'space';
      if (key === 'enter') key = 'enter';
      if (key === 'escape') key = 'escape';
      parts.push(key);

      const combo = parts.join('+');

      // Check if this combo matches any shortcut
      const handler = shortcuts[combo];

      if (handler) {
        // Allow escape in inputs, but prevent other shortcuts
        if (isInput || isContentEditable) {
          if (key !== 'escape') return;
        }

        event.preventDefault();
        event.stopPropagation();
        handler();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Returns platform-specific display strings for shortcuts
 */
export function getShortcutDisplay(combo: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return combo
    .split('+')
    .map(part => {
      switch (part) {
        case 'mod': return isMac ? '⌘' : 'Ctrl';
        case 'shift': return isMac ? '⇧' : 'Shift';
        case 'alt': return isMac ? '⌥' : 'Alt';
        case 'enter': return '↵';
        case 'escape': return 'Esc';
        case 'space': return '␣';
        default: return part.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');
}
