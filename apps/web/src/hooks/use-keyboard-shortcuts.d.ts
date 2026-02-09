type KeyCombo = string;
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
export declare function useKeyboardShortcuts(shortcuts: ShortcutMap, options?: UseKeyboardShortcutsOptions): void;
/**
 * Returns platform-specific display strings for shortcuts
 */
export declare function getShortcutDisplay(combo: string): string;
export {};
//# sourceMappingURL=use-keyboard-shortcuts.d.ts.map