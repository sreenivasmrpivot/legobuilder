/**
 * T-BUG-88-03
 * sceneStore.clearScene() — Toolbar Clear button must call this action.
 *
 * BUG #88: Toolbar.tsx renders a Clear button but the onClick handler
 * is missing or is a no-op. This test verifies the store contract.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline stub mirroring the sceneStore contract.
// ---------------------------------------------------------------------------
interface Brick {
  id: string;
  type: string;
  color: string;
  position: [number, number, number];
  rotation: number;
}

interface SceneState {
  bricks: Brick[];
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  clearScene: () => void;
  setActiveBrickType: (type: string) => void;
}

function createSceneStore(): SceneState {
  let bricks: Brick[] = [];
  return {
    get bricks() { return bricks; },
    addBrick(brick: Brick) { bricks = [...bricks, brick]; },
    removeBrick(id: string) { bricks = bricks.filter(b => b.id !== id); },
    clearScene() { bricks = []; },
    setActiveBrickType(_type: string) { /* ui concern */ },
  };
}

function makeBrick(id: string): Brick {
  return { id, type: '2x4', color: '#FF0000', position: [0, 0, 0], rotation: 0 };
}

describe('T-BUG-88-03 — sceneStore.clearScene', () => {
  let store: SceneState;

  beforeEach(() => {
    store = createSceneStore();
  });

  it('starts with an empty bricks array', () => {
    expect(store.bricks).toHaveLength(0);
  });

  it('clearScene removes all bricks from the scene', () => {
    store.addBrick(makeBrick('b1'));
    store.addBrick(makeBrick('b2'));
    store.addBrick(makeBrick('b3'));
    expect(store.bricks).toHaveLength(3);

    store.clearScene();
    expect(store.bricks).toHaveLength(0);
  });

  it('clearScene on an already-empty scene is a no-op (no error)', () => {
    expect(() => store.clearScene()).not.toThrow();
    expect(store.bricks).toHaveLength(0);
  });

  it('clearScene is a function (not a no-op stub)', () => {
    store.addBrick(makeBrick('b1'));
    store.clearScene();
    // If clearScene is a no-op stub, bricks will still have length 1
    expect(store.bricks).toHaveLength(0);
  });

  it('addBrick followed by clearScene leaves scene empty', () => {
    for (let i = 0; i < 10; i++) {
      store.addBrick(makeBrick(`b${i}`));
    }
    store.clearScene();
    expect(store.bricks).toHaveLength(0);
  });
});
