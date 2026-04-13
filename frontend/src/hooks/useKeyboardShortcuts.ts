import { useEffect, useCallback } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useUiStore } from '../stores/uiStore';

export function useKeyboardShortcuts() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const removeBrick = useSceneStore((s) => s.removeBrick);
  const selectedBrickId = useSelectionStore((s) => s.selectedBrickId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const rotatePlacementPreview = useUiStore((s) => s.rotatePlacementPreview);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept events from input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+Shift+Z → Redo
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+Z → Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y → Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Delete / Backspace → Remove selected brick
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBrickId) {
          e.preventDefault();
          removeBrick(selectedBrickId);
        }
        return;
      }

      // Escape → Clear selection
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // R → Rotate placement preview
      if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          rotatePlacementPreview();
        }
        return;
      }
    },
    [undo, redo, removeBrick, selectedBrickId, clearSelection, rotatePlacementPreview]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
