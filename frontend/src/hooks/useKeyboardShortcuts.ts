/**
 * useKeyboardShortcuts — Global keyboard shortcut handler
 *
 * Registers global keyboard shortcuts for the application.
 * Includes Escape key to clear brick selection (FR-EDIT-001).
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 12 (Open Question #3)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-E2E-EDIT-001-01
 */

import { useEffect } from 'react';
import { useSelectionStore } from '../stores/selectionStore';

/**
 * Hook that registers global keyboard shortcuts.
 *
 * Shortcuts:
 *   - Escape: Clear the current brick selection
 *   - (Future: Ctrl+Z for undo, Ctrl+Y for redo, Delete for remove brick)
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape': {
          // Clear brick selection (FR-EDIT-001)
          const { selectedBrickId, clearSelection } =
            useSelectionStore.getState();
          if (selectedBrickId !== null) {
            clearSelection();
          }
          break;
        }
        // Future keyboard shortcuts will be added here
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
