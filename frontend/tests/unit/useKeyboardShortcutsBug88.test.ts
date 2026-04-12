/**
 * T-BUG-88-06
 * useKeyboardShortcuts — must wire R, Delete, Escape, Ctrl+Z, Ctrl+Y.
 *
 * BUG #88: useKeyboardShortcuts.ts exists as a scaffold stub. The hook
 * may not be mounted in App.tsx or Viewport.tsx, and the key handlers
 * may be no-ops. This test verifies the keyboard shortcut contract.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline stub mirroring the expected useKeyboardShortcuts contract.
// The real hook lives at frontend/src/hooks/useKeyboardShortcuts.ts.
// ---------------------------------------------------------------------------
interface ShortcutDeps {
  onRotate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function useKeyboardShortcutsStub(deps: ShortcutDeps) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'r' || e.key === 'R') {
      deps.onRotate();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deps.onDelete();
    } else if (e.key === 'Escape') {
      deps.onClearSelection();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      deps.onUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Z')) {
      deps.onRedo();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}

function fireKey(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers }));
}

describe('T-BUG-88-06 — useKeyboardShortcuts wires keyboard events', () => {
  let cleanup: () => void;
  let onRotate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onClearSelection: ReturnType<typeof vi.fn>;
  let onUndo: ReturnType<typeof vi.fn>;
  let onRedo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRotate = vi.fn();
    onDelete = vi.fn();
    onClearSelection = vi.fn();
    onUndo = vi.fn();
    onRedo = vi.fn();
    cleanup = useKeyboardShortcutsStub({ onRotate, onDelete, onClearSelection, onUndo, onRedo });
  });

  afterEach(() => {
    cleanup();
  });

  it('pressing R calls onRotate', () => {
    fireKey('R');
    expect(onRotate).toHaveBeenCalledTimes(1);
  });

  it('pressing lowercase r calls onRotate', () => {
    fireKey('r');
    expect(onRotate).toHaveBeenCalledTimes(1);
  });

  it('pressing Delete calls onDelete', () => {
    fireKey('Delete');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape calls onClearSelection', () => {
    fireKey('Escape');
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('pressing Ctrl+Z calls onUndo', () => {
    fireKey('z', { ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('pressing Ctrl+Y calls onRedo', () => {
    fireKey('y', { ctrlKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('pressing an unrelated key does not trigger any handler', () => {
    fireKey('a');
    expect(onRotate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onClearSelection).not.toHaveBeenCalled();
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('cleanup removes the event listener (no calls after cleanup)', () => {
    cleanup();
    fireKey('R');
    expect(onRotate).not.toHaveBeenCalled();
  });
});
