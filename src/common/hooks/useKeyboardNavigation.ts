import { useEffect } from 'react';

interface UseKeyboardNavigationOptions {
  readonly enabled: boolean;
  readonly filteredItems: readonly { path: string }[];
  readonly selectedIndex: number;
  readonly onEscape?: () => void;
  readonly onNavigate: (path: string) => void;
  readonly setSelectedIndex: (updater: (prev: number) => number) => void;
}

/**
 * Shared hook for keyboard navigation in search interfaces
 * Handles ArrowDown, ArrowUp, Enter, and Escape keys
 */
export function useKeyboardNavigation({
  enabled,
  filteredItems,
  selectedIndex,
  onEscape,
  onNavigate,
  setSelectedIndex
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (!filteredItems.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        onNavigate(filteredItems[selectedIndex].path);
      }
    };

    globalThis.addEventListener('keydown', handleKeyboardNavigation);
    return () => globalThis.removeEventListener('keydown', handleKeyboardNavigation);
  }, [enabled, filteredItems, selectedIndex, onEscape, onNavigate, setSelectedIndex]);
}

