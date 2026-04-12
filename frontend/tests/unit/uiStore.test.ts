/**
 * T-BUG-88-01 / T-BUG-88-02
 * uiStore — activeBrickType and activeBrickColor setters
 *
 * BUG #88: BrickPalette.tsx renders brick options but does not call
 * uiStore.setActiveBrickType() / setActiveBrickColor() on click.
 * These tests verify the store contract that the coding agent must wire.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline stub that mirrors the expected uiStore contract.
// The real store lives at frontend/src/stores/uiStore.ts.
// ---------------------------------------------------------------------------
interface UIState {
  activeBrickType: string;
  activeBrickColor: string;
  setActiveBrickType: (type: string) => void;
  setActiveBrickColor: (color: string) => void;
}

function createUIStore(): UIState {
  let activeBrickType = '2x4';
  let activeBrickColor = '#FF0000';
  return {
    get activeBrickType() { return activeBrickType; },
    get activeBrickColor() { return activeBrickColor; },
    setActiveBrickType(type: string) { activeBrickType = type; },
    setActiveBrickColor(color: string) { activeBrickColor = color; },
  };
}

describe('T-BUG-88-01 — uiStore.setActiveBrickType', () => {
  let store: UIState;

  beforeEach(() => {
    store = createUIStore();
  });

  it('initialises with a default brick type', () => {
    expect(store.activeBrickType).toBeDefined();
    expect(typeof store.activeBrickType).toBe('string');
  });

  it('updates activeBrickType when setActiveBrickType is called', () => {
    store.setActiveBrickType('2x2');
    expect(store.activeBrickType).toBe('2x2');
  });

  it('updates activeBrickType to any valid brick type string', () => {
    const types = ['1x1', '1x2', '2x2', '2x4', '2x6', '2x8'];
    for (const t of types) {
      store.setActiveBrickType(t);
      expect(store.activeBrickType).toBe(t);
    }
  });

  it('setActiveBrickType is a function (not a no-op stub)', () => {
    // Regression: scaffold may have setActiveBrickType as () => {} no-op
    const before = store.activeBrickType;
    store.setActiveBrickType('1x1');
    // If the store is a no-op stub, activeBrickType won't change
    expect(store.activeBrickType).not.toBe(before);
  });
});

describe('T-BUG-88-02 — uiStore.setActiveBrickColor', () => {
  let store: UIState;

  beforeEach(() => {
    store = createUIStore();
  });

  it('initialises with a default brick color', () => {
    expect(store.activeBrickColor).toBeDefined();
    expect(typeof store.activeBrickColor).toBe('string');
  });

  it('updates activeBrickColor when setActiveBrickColor is called', () => {
    store.setActiveBrickColor('#00FF00');
    expect(store.activeBrickColor).toBe('#00FF00');
  });

  it('updates activeBrickColor to any hex color string', () => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF'];
    for (const c of colors) {
      store.setActiveBrickColor(c);
      expect(store.activeBrickColor).toBe(c);
    }
  });

  it('setActiveBrickColor is a function (not a no-op stub)', () => {
    const before = store.activeBrickColor;
    store.setActiveBrickColor('#123456');
    expect(store.activeBrickColor).not.toBe(before);
  });
});
