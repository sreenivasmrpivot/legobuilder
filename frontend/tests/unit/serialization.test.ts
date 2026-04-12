import { describe, it, expect } from 'vitest';
import { exportScene, importScene } from '../../src/engine/serialization';
import type { SceneState } from '../../src/stores/sceneStore';

describe('Serialization', () => {
  const mockState: SceneState = {
    bricks: {
      'b1': { id: 'b1', type: '2x4', position: [0, 0, 0], rotation: 0, color: '#D01012' },
      'b2': { id: 'b2', type: '1x1', position: [5, 0, 3], rotation: 90, color: '#0057A8' },
    },
    gridSize: [32, 32], sceneName: 'Test Scene', sceneId: 'test-id', isDirty: false, brickCount: 2,
  };

  it('should export scene with schema version', () => {
    const exported = exportScene(mockState);
    expect(exported.version).toBe(1);
    expect(exported.bricks).toHaveLength(2);
  });

  it('should round-trip export/import', () => {
    const json = JSON.stringify(exportScene(mockState));
    const imported = importScene(json);
    expect(imported.brickCount).toBe(2);
  });

  it('should reject invalid JSON', () => {
    expect(() => importScene('{}')).toThrow('Missing schema version');
  });
});
