import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled: boolean = true;

  register(shortcut: KeyboardShortcut) {
    const key = this.getKeyString(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregister(key: string) {
    this.shortcuts.delete(key);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  getKeyString(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return;

    const key = event.key.toLowerCase();
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(key);

    const keyString = parts.join('+');
    const shortcut = this.shortcuts.get(keyString);

    if (shortcut && !this.isTypingInInput(event)) {
      event.preventDefault();
      shortcut.action();
    }
  }

  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }
}

const shortcutManager = new KeyboardShortcutManager();

// Initialize keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => shortcutManager.handleKeyDown(e));
}

function getKeyString(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('ctrl');
  if (shortcut.shift) parts.push('shift');
  if (shortcut.alt) parts.push('alt');
  if (shortcut.meta) parts.push('meta');
  parts.push(shortcut.key.toLowerCase());
  return parts.join('+');
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  enabled: boolean = true
) {
  useEffect(() => {
    if (enabled) {
      shortcutManager.register(shortcut);
      return () => {
        shortcutManager.unregister(getKeyString(shortcut));
      };
    }
  }, [enabled, shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt, shortcut.meta]);
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (enabled) {
      shortcuts.forEach((shortcut) => {
        shortcutManager.register(shortcut);
      });
      return () => {
        shortcuts.forEach((shortcut) => {
          shortcutManager.unregister(getKeyString(shortcut));
        });
      };
    }
  }, [enabled, shortcuts]);
}

export default shortcutManager;

