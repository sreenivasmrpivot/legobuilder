import type { Brick, BrickType } from '../types/brick';
import type { SceneState } from '../stores/sceneStore';

const SCHEMA_VERSION = 1;

export interface SceneExport {
  version: number;
  name: string;
  gridSize: [number, number];
  bricks: Array<{ type: BrickType; position: [number, number, number]; rotation: number; color: string }>;
  exportedAt: string;
}

export function exportScene(state: SceneState): SceneExport {
  return {
    version: SCHEMA_VERSION,
    name: state.sceneName,
    gridSize: state.gridSize,
    bricks: Object.values(state.bricks).map(({ type, position, rotation, color }) => ({ type, position, rotation, color })),
    exportedAt: new Date().toISOString(),
  };
}

export function importScene(json: string): SceneState {
  const data = JSON.parse(json) as SceneExport;
  validateSchema(data);
  const migrated = migrateSchema(data);
  return deserializeToState(migrated);
}

function validateSchema(data: unknown): asserts data is SceneExport {
  if (!data || typeof data !== 'object') throw new Error('Invalid scene file');
  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'number') throw new Error('Missing schema version');
  if (!Array.isArray(d.bricks)) throw new Error('Missing bricks array');
}

function migrateSchema(data: SceneExport): SceneExport {
  return data;
}

function deserializeToState(data: SceneExport): SceneState {
  const bricks: Record<string, Brick> = {};
  data.bricks.forEach((b, i) => {
    const id = `imported-${i}`;
    bricks[id] = { id, ...b };
  });
  return { bricks, gridSize: data.gridSize, sceneName: data.name, sceneId: null, isDirty: false, brickCount: data.bricks.length };
}
