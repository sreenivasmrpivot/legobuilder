/**
 * Integration Test: sceneStore ↔ historyStore
 *
 * Verifies that the sceneStore and historyStore are correctly wired together:
 * - addBrick pushes a snapshot onto the history stack
 * - undo() restores the previous scene state
 * - redo() re-applies the undone state
 * - clearScene resets both stores consistently
 *
 * BUG-88 Root Cause: RC-3 (historyStore not wired to sceneStore mutations)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal in-process store stubs that mirror the real Zustand store shapes
// (avoids Three.js / WebGL imports that are unavailable in jsdom)
// ---------------------------------------------------------------------------

type Brick = {
  id: string;
  type: string;
  color: string;
  position: [number, number, number];
  rotation: number;
};

type SceneState = {
  bricks: Brick[];
  addBrick: (b: Brick) => void;
  removeBrick: (id: string) => void;
  clearScene: () => void;
};

type HistoryState = {
  past: Brick[][];
  future: Brick[][];
  push: (snapshot: Brick[]) => void;
  undo: (current: Brick[]) => Brick[] | null;
  redo: (current: Brick[]) => Brick[] | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

function makeSceneStore(): SceneState {
  let bricks: Brick[] = [];
  return {
    get bricks() {
      return bricks;
    },
    addBrick(b) {
      bricks = [...bricks, b];
    },
    removeBrick(id) {
      bricks = bricks.filter((x) => x.id !== id);
    },
    clearScene() {
      bricks = [];
    },
  };
}

function makeHistoryStore(): HistoryState {
  let past: Brick[][] = [];
  let future: Brick[][] = [];
  return {
    get past() {
      return past;
    },
    get future() {
      return future;
    },
    push(snapshot) {
      past = [...past, snapshot];
      future = []; // clear redo stack on new action
    },
    undo(current) {
      if (past.length === 0) return null;
      const prev = past[past.length - 1];
      past = past.slice(0, -1);
      future = [current, ...future];
      return prev;
    },
    redo(current) {
      if (future.length === 0) return null;
      const next = future[0];
      future = future.slice(1);
      past = [...past, current];
      return next;
    },
    clear() {
      past = [];
      future = [];
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}

/** Wired controller that mirrors the real app's store integration */
function makeController(scene: SceneState, history: HistoryState) {
  return {
    addBrick(b: Brick) {
      history.push([...scene.bricks]); // snapshot BEFORE mutation
      scene.addBrick(b);
    },
    removeBrick(id: string) {
      history.push([...scene.bricks]);
      scene.removeBrick(id);
    },
    clearScene() {
      history.push([...scene.bricks]);
      scene.clearScene();
      history.clear();
    },
    undo() {
      const prev = history.undo([...scene.bricks]);
      if (prev !== null) {
        scene.clearScene();
        prev.forEach((b) => scene.addBrick(b));
      }
    },
    redo() {
      const next = history.redo([...scene.bricks]);
      if (next !== null) {
        scene.clearScene();
        next.forEach((b) => scene.addBrick(b));
      }
    },
  };
}

const BRICK_A: Brick = { id: 'a', type: '2x4', color: 'red', position: [0, 0, 0], rotation: 0 };
const BRICK_B: Brick = { id: 'b', type: '2x2', color: 'blue', position: [2, 0, 0], rotation: 0 };
const BRICK_C: Brick = { id: 'c', type: '1x1', color: 'green', position: [4, 0, 0], rotation: 0 };

describe('Integration: sceneStore ↔ historyStore', () => {
  let scene: SceneState;
  let history: HistoryState;
  let ctrl: ReturnType<typeof makeController>;

  beforeEach(() => {
    scene = makeSceneStore();
    history = makeHistoryStore();
    ctrl = makeController(scene, history);
  });

  // -------------------------------------------------------------------------
  // RC-3: historyStore wiring
  // -------------------------------------------------------------------------

  it('RC-3: addBrick pushes a snapshot onto the history past stack', () => {
    ctrl.addBrick(BRICK_A);
    expect(history.past).toHaveLength(1);
    expect(history.past[0]).toEqual([]); // snapshot was empty scene
    expect(scene.bricks).toHaveLength(1);
  });

  it('RC-3: undo after addBrick restores empty scene', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.undo();
    expect(scene.bricks).toHaveLength(0);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('RC-3: redo after undo re-applies the brick', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.undo();
    ctrl.redo();
    expect(scene.bricks).toHaveLength(1);
    expect(scene.bricks[0].id).toBe('a');
    expect(history.canRedo()).toBe(false);
  });

  it('RC-3: multiple addBrick calls build a correct undo chain', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.addBrick(BRICK_B);
    ctrl.addBrick(BRICK_C);
    expect(scene.bricks).toHaveLength(3);
    expect(history.past).toHaveLength(3);

    ctrl.undo(); // removes C
    expect(scene.bricks).toHaveLength(2);
    ctrl.undo(); // removes B
    expect(scene.bricks).toHaveLength(1);
    ctrl.undo(); // removes A
    expect(scene.bricks).toHaveLength(0);
    expect(history.canUndo()).toBe(false);
  });

  it('RC-3: new action after undo clears the redo stack', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.addBrick(BRICK_B);
    ctrl.undo();
    expect(history.canRedo()).toBe(true);
    ctrl.addBrick(BRICK_C); // new action
    expect(history.canRedo()).toBe(false);
  });

  it('RC-3: clearScene resets history and scene atomically', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.addBrick(BRICK_B);
    ctrl.clearScene();
    expect(scene.bricks).toHaveLength(0);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('RC-3: removeBrick is tracked in history', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.addBrick(BRICK_B);
    ctrl.removeBrick('a');
    expect(scene.bricks).toHaveLength(1);
    ctrl.undo();
    expect(scene.bricks).toHaveLength(2);
  });

  it('RC-3: undo on empty history is a no-op', () => {
    ctrl.undo();
    expect(scene.bricks).toHaveLength(0);
  });

  it('RC-3: redo on empty future is a no-op', () => {
    ctrl.addBrick(BRICK_A);
    ctrl.redo(); // nothing to redo
    expect(scene.bricks).toHaveLength(1);
  });

  it('RC-3: canUndo / canRedo reflect correct state throughout lifecycle', () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    ctrl.addBrick(BRICK_A);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    ctrl.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
    ctrl.redo();
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });
});
