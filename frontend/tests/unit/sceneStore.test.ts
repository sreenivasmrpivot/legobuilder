/**
 * Unit tests for sceneStore (Zustand)
 *
 * FR: FR-SCENE-001
 * Test IDs:
 *   T-UNIT-SCENE-001-01  initial state shape
 *   T-UNIT-SCENE-001-02  toggleGrid flips showGrid
 *   T-UNIT-SCENE-001-03  setBackgroundColor updates backgroundColor
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-001
 * Spectra-Tests: T-UNIT-SCENE-001-01, T-UNIT-SCENE-001-02, T-UNIT-SCENE-001-03
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/stores/sceneStore';

// Reset Zustand store state between tests
beforeEach(() => {
  useSceneStore.setState({
    showGrid: true,
    backgroundColor: '#1a1a2e',
    ambientIntensity: 0.4,
    bricks: [],
  });
});

describe('sceneStore — T-UNIT-SCENE-001-01: initial state', () => {
  it('should have showGrid=true by default', () => {
    const { showGrid } = useSceneStore.getState();
    expect(showGrid).toBe(true);
  });

  it('should have a valid default backgroundColor', () => {
    const { backgroundColor } = useSceneStore.getState();
    expect(backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('should have ambientIntensity between 0 and 1', () => {
    const { ambientIntensity } = useSceneStore.getState();
    expect(ambientIntensity).toBeGreaterThanOrEqual(0);
    expect(ambientIntensity).toBeLessThanOrEqual(1);
  });

  it('should start with an empty bricks array', () => {
    const { bricks } = useSceneStore.getState();
    expect(Array.isArray(bricks)).toBe(true);
    expect(bricks).toHaveLength(0);
  });
});

describe('sceneStore — T-UNIT-SCENE-001-02: toggleGrid', () => {
  it('should flip showGrid from true to false', () => {
    const store = useSceneStore.getState();
    expect(store.showGrid).toBe(true);
    store.toggleGrid();
    expect(useSceneStore.getState().showGrid).toBe(false);
  });

  it('should flip showGrid from false back to true', () => {
    useSceneStore.setState({ showGrid: false });
    useSceneStore.getState().toggleGrid();
    expect(useSceneStore.getState().showGrid).toBe(true);
  });

  it('should be idempotent when toggled twice', () => {
    const initial = useSceneStore.getState().showGrid;
    useSceneStore.getState().toggleGrid();
    useSceneStore.getState().toggleGrid();
    expect(useSceneStore.getState().showGrid).toBe(initial);
  });
});

describe('sceneStore — T-UNIT-SCENE-001-03: setBackgroundColor', () => {
  it('should update backgroundColor to a new hex value', () => {
    useSceneStore.getState().setBackgroundColor('#ff0000');
    expect(useSceneStore.getState().backgroundColor).toBe('#ff0000');
  });

  it('should accept any valid CSS hex color', () => {
    useSceneStore.getState().setBackgroundColor('#000000');
    expect(useSceneStore.getState().backgroundColor).toBe('#000000');
  });

  it('should not mutate other state fields when setting backgroundColor', () => {
    const before = useSceneStore.getState().showGrid;
    useSceneStore.getState().setBackgroundColor('#abcdef');
    expect(useSceneStore.getState().showGrid).toBe(before);
  });
});
