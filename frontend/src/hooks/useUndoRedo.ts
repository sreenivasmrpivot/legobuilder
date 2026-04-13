import { useCallback } from 'react';
import { useHistoryStore } from '../stores/historyStore';

export function useUndoRedo() {
  const undoAction = useHistoryStore((s) => s.undo);
  const redoAction = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  const undo = useCallback(() => {
    if (canUndo) undoAction();
  }, [canUndo, undoAction]);

  const redo = useCallback(() => {
    if (canRedo) redoAction();
  }, [canRedo, redoAction]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
