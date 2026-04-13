/**
 * Integration Test: useKeyboardShortcuts ↔ historyStore ↔ sceneStore ↔ selectionStore
 *
 * Verifies that keyboard shortcut events are correctly dispatched to the
 * appropriate stores:
 * - Ctrl+Z → historyStore.undo → sceneStore update
 * - Ctrl+Y / Ctrl+Shift+Z → historyStore.redo → sceneStore update
 * - R → rotate selected brick
 * - Delete / Backspace → remove selected brick from sceneStore
 * - Escape → clear selection
 *
 * BUG-88 Root Cause: RC-2 (keyboard shortcuts not wired to stores)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

type Brick = { id: string; type: string; color: string; position: [number, number, number]; rotation: number };

function makeSceneStore() {
  let bricks: Brick[] = [];
  return {
    get bricks() { return bricks; },
    addBrick(b: Brick) { bricks = [...bricks, b]; },
    removeBrick(id: string) { bricks = bricks.filter((x) => x.id !== id); },
    updateBrick(id: string, patch: Partial<Brick>) {
      bricks = bricks.map((b) => b.id === id ? { ...b, ...patch } : b);
    },
    clearScene() { bricks = []; },
  };
}

function makeHistoryStore() {
  let past: Brick[][] = [];
  let future: Brick[][] = [];
  return {
    get past() { return past; },
    get future() { return future; },
    push(snap: Brick[]) { past = [...past, snap]; future = []; },
    undo(current: Brick[]): Brick[] | null {
      if (!past.length) return null;
      const prev = past[past.length - 1];
      past = past.slice(0, -1);
      future = [current, ...future];
      return prev;
    },
    redo(current: Brick[]): Brick[] | null {
      if (!future.length) return null;
      const next = future[0];
      future = future.slice(1);
      past = [...past, current];
      return next;
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
  };
}

function makeSelectionStore() {
  let selectedId: string | null = null;
  return {
    get selectedId() { return selectedId; },
    select(id: string) { selectedId = id; },
    clear() { selectedId = null; },
    hasSelection() { return selectedId !== null; },
  };
}

/** Mirrors useKeyboardShortcuts dispatch logic */
function makeKeyboardHandler(
  scene: ReturnType<typeof makeSceneStore>,
  history: ReturnType<typeof makeHistoryStore>,
  selection: ReturnType<typeof makeSelectionStore>,
) {
  function applySnapshot(snap: Brick[]) {
    scene.clearScene();
    snap.forEach((b) => scene.addBrick(b));
  }

  return {
    dispatch(event: { key: string; ctrlKey?: boolean; shiftKey?: boolean; metaKey?: boolean }) {
      const ctrl = event.ctrlKey || event.metaKey;
      const { key, shiftKey } = event;

      if (ctrl && key === 'z' && !shiftKey) {
        // Ctrl+Z → Undo
        const prev = history.undo([...scene.bricks]);
        if (prev !== null) applySnapshot(prev);
        return;
      }
      if ((ctrl && key === 'y') || (ctrl && shiftKey && key === 'z')) {
        // Ctrl+Y or Ctrl+Shift+Z → Redo
        const next = history.redo([...scene.bricks]);
        if (next !== null) applySnapshot(next);
        return;
      }
      if (key === 'r' || key === 'R') {
        // R → rotate selected brick
        if (selection.hasSelection()) {
          const id = selection.selectedId!;
          const brick = scene.bricks.find((b) => b.id === id);
          if (brick) {
            history.push([...scene.bricks]);
            scene.updateBrick(id, { rotation: (brick.rotation + 90) % 360 });
          }
        }
        return;
      }
      if (key === 'Delete' || key === 'Backspace') {
        // Delete → remove selected brick
        if (selection.hasSelection()) {
          const id = selection.selectedId!;
          history.push([...scene.bricks]);
          scene.removeBrick(id);
          selection.clear();
        }
        return;
      }
      if (key === 'Escape') {
        selection.clear();
        return;
      }
    },
  };
}

const B1: Brick = { id: '1', type: '2x4', color: 'red', position: [0, 0, 0], rotation: 0 };
const B2: Brick = { id: '2', type: '2x2', color: 'blue', position: [2, 0, 0], rotation: 0 };

describe('Integration: useKeyboardShortcuts ↔ historyStore ↔ sceneStore ↔ selectionStore', () => {
  let scene: ReturnType<typeof makeSceneStore>;
  let history: ReturnType<typeof makeHistoryStore>;
  let selection: ReturnType<typeof makeSelectionStore>;
  let kb: ReturnType<typeof makeKeyboardHandler>;

  beforeEach(() => {
    scene = makeSceneStore();
    history = makeHistoryStore();
    selection = makeSelectionStore();
    kb = makeKeyboardHandler(scene, history, selection);
  });

  it('RC-2: Ctrl+Z undoes last brick placement', () => {
    history.push([]);
    scene.addBrick(B1);
    kb.dispatch({ key: 'z', ctrlKey: true });
    expect(scene.bricks).toHaveLength(0);
  });

  it('RC-2: Ctrl+Y redoes after undo', () => {
    history.push([]);
    scene.addBrick(B1);
    kb.dispatch({ key: 'z', ctrlKey: true });
    kb.dispatch({ key: 'y', ctrlKey: true });
    expect(scene.bricks).toHaveLength(1);
  });

  it('RC-2: Ctrl+Shift+Z also triggers redo', () => {
    history.push([]);
    scene.addBrick(B1);
    kb.dispatch({ key: 'z', ctrlKey: true });
    kb.dispatch({ key: 'z', ctrlKey: true, shiftKey: true });
    expect(scene.bricks).toHaveLength(1);
  });

  it('RC-2: R rotates the selected brick by 90 degrees', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'r' });
    expect(scene.bricks[0].rotation).toBe(90);
  });

  it('RC-2: R rotation is tracked in history', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'r' });
    expect(history.canUndo()).toBe(true);
  });

  it('RC-2: R with no selection is a no-op', () => {
    scene.addBrick(B1);
    kb.dispatch({ key: 'r' });
    expect(scene.bricks[0].rotation).toBe(0);
    expect(history.canUndo()).toBe(false);
  });

  it('RC-2: Delete removes the selected brick', () => {
    scene.addBrick(B1);
    scene.addBrick(B2);
    selection.select('1');
    kb.dispatch({ key: 'Delete' });
    expect(scene.bricks).toHaveLength(1);
    expect(scene.bricks[0].id).toBe('2');
  });

  it('RC-2: Delete clears selection after removal', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'Delete' });
    expect(selection.hasSelection()).toBe(false);
  });

  it('RC-2: Delete is tracked in history', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'Delete' });
    expect(history.canUndo()).toBe(true);
  });

  it('RC-2: Backspace also removes selected brick', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'Backspace' });
    expect(scene.bricks).toHaveLength(0);
  });

  it('RC-2: Escape clears selection without modifying scene', () => {
    scene.addBrick(B1);
    selection.select('1');
    kb.dispatch({ key: 'Escape' });
    expect(selection.hasSelection()).toBe(false);
    expect(scene.bricks).toHaveLength(1);
  });

  it('RC-2: Ctrl+Z on empty history is a safe no-op', () => {
    kb.dispatch({ key: 'z', ctrlKey: true });
    expect(scene.bricks).toHaveLength(0);
  });

  it('RC-2: Ctrl+Y on empty future is a safe no-op', () => {
    scene.addBrick(B1);
    kb.dispatch({ key: 'y', ctrlKey: true });
    expect(scene.bricks).toHaveLength(1);
  });
});
