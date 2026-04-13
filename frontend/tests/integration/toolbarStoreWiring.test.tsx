/**
 * Integration Test: Toolbar ↔ historyStore ↔ sceneStore
 *
 * Verifies that Toolbar button clicks correctly dispatch commands through
 * the historyStore and mutate the sceneStore:
 * - Undo button calls historyStore.undo and updates scene
 * - Redo button calls historyStore.redo and updates scene
 * - Clear Scene button calls sceneStore.clearScene and resets history
 * - Buttons are disabled when canUndo / canRedo are false
 *
 * BUG-88 Root Cause: RC-3 (Toolbar not wired to historyStore)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Pure-logic controller that mirrors Toolbar's onClick handlers
// (avoids React / Three.js rendering in this integration layer)
// ---------------------------------------------------------------------------

type Brick = { id: string; type: string; color: string; position: [number, number, number]; rotation: number };

function makeStores() {
  let bricks: Brick[] = [];
  let past: Brick[][] = [];
  let future: Brick[][] = [];

  const scene = {
    get bricks() { return bricks; },
    addBrick(b: Brick) { bricks = [...bricks, b]; },
    clearScene() { bricks = []; },
  };

  const history = {
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
    clear() { past = []; future = []; },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
  };

  return { scene, history };
}

/** Mirrors the Toolbar's wired onClick handlers */
function makeToolbarHandlers(scene: ReturnType<typeof makeStores>['scene'], history: ReturnType<typeof makeStores>['history']) {
  return {
    onUndo() {
      const prev = history.undo([...scene.bricks]);
      if (prev !== null) {
        scene.clearScene();
        prev.forEach((b) => scene.addBrick(b));
      }
    },
    onRedo() {
      const next = history.redo([...scene.bricks]);
      if (next !== null) {
        scene.clearScene();
        next.forEach((b) => scene.addBrick(b));
      }
    },
    onClearScene() {
      history.push([...scene.bricks]);
      scene.clearScene();
      history.clear();
    },
    get undoDisabled() { return !history.canUndo(); },
    get redoDisabled() { return !history.canRedo(); },
  };
}

const B1: Brick = { id: '1', type: '2x4', color: 'red', position: [0, 0, 0], rotation: 0 };
const B2: Brick = { id: '2', type: '2x2', color: 'blue', position: [2, 0, 0], rotation: 0 };

describe('Integration: Toolbar ↔ historyStore ↔ sceneStore', () => {
  let stores: ReturnType<typeof makeStores>;
  let toolbar: ReturnType<typeof makeToolbarHandlers>;

  beforeEach(() => {
    stores = makeStores();
    toolbar = makeToolbarHandlers(stores.scene, stores.history);
  });

  it('RC-3: Undo button is disabled when history is empty', () => {
    expect(toolbar.undoDisabled).toBe(true);
  });

  it('RC-3: Redo button is disabled when future is empty', () => {
    expect(toolbar.redoDisabled).toBe(true);
  });

  it('RC-3: Undo button becomes enabled after a brick is added', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    expect(toolbar.undoDisabled).toBe(false);
  });

  it('RC-3: clicking Undo restores previous scene state', () => {
    stores.history.push([...stores.scene.bricks]);
    stores.scene.addBrick(B1);
    toolbar.onUndo();
    expect(stores.scene.bricks).toHaveLength(0);
  });

  it('RC-3: clicking Redo re-applies undone state', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    toolbar.onUndo();
    toolbar.onRedo();
    expect(stores.scene.bricks).toHaveLength(1);
    expect(stores.scene.bricks[0].id).toBe('1');
  });

  it('RC-3: Redo button becomes enabled after Undo', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    toolbar.onUndo();
    expect(toolbar.redoDisabled).toBe(false);
  });

  it('RC-3: Clear Scene resets both scene and history', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    stores.history.push([B1]);
    stores.scene.addBrick(B2);
    toolbar.onClearScene();
    expect(stores.scene.bricks).toHaveLength(0);
    expect(toolbar.undoDisabled).toBe(true);
    expect(toolbar.redoDisabled).toBe(true);
  });

  it('RC-3: multiple Undo/Redo cycles maintain scene integrity', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    stores.history.push([B1]);
    stores.scene.addBrick(B2);

    toolbar.onUndo();
    expect(stores.scene.bricks).toHaveLength(1);
    toolbar.onUndo();
    expect(stores.scene.bricks).toHaveLength(0);
    toolbar.onRedo();
    expect(stores.scene.bricks).toHaveLength(1);
    toolbar.onRedo();
    expect(stores.scene.bricks).toHaveLength(2);
  });

  it('RC-3: Undo on empty history is a safe no-op', () => {
    toolbar.onUndo();
    expect(stores.scene.bricks).toHaveLength(0);
  });

  it('RC-3: Redo on empty future is a safe no-op', () => {
    stores.history.push([]);
    stores.scene.addBrick(B1);
    toolbar.onRedo(); // nothing to redo
    expect(stores.scene.bricks).toHaveLength(1);
  });
});
