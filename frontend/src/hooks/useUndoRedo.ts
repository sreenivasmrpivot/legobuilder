import { useHistoryStore } from '../stores/historyStore';

export function useUndoRedo() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
