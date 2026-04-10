/**
 * Hook: useKeyboardShortcuts
 *
 * Registers global keyboard shortcuts for the application.
 * See TECHNICAL_ARCHITECTURE.md Section 11 for the full shortcut table.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (_e: KeyboardEvent) => {
      // TODO: Implement in feature branch
      // Ctrl+Z -> undo, Ctrl+Y -> redo, Delete -> delete selected,
      // R -> rotate, Escape -> deselect, 1-6 -> brick type, etc.
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
