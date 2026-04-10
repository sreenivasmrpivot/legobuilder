/**
 * Hook: useUndoRedo
 *
 * Provides undo/redo actions bound to keyboard shortcuts (Ctrl+Z / Ctrl+Y).
 * Delegates to the history store's command stack.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { useCallback } from 'react';
import { useHistoryStore } from '../stores/historyStore';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  const handleUndo = useCallback(() => {
    if (canUndo) undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) redo();
  }, [canRedo, redo]);

  return { handleUndo, handleRedo, canUndo, canRedo };
}
