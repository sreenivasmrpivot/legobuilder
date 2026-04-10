import type { Brick, BrickType } from '@/types/brick';
import { BRICK_CATALOG, COLOR_PALETTE } from './brickCatalog';

export interface ExportSchema {
  version: '1.0.0';
  metadata: {
    name: string;
    createdAt: string;
    brickCount: number;
    application: 'LegoBuilder';
  };
  scene: {
    baseplate: { width: number; depth: number };
    bricks: Array<{
      id: string;
      type: BrickType;
      position: [number, number, number];
      rotation: number;
      color: string;
    }>;
  };
}

export function serializeScene(
  name: string,
  bricks: Map<string, Brick>,
  baseplate: { width: number; depth: number }
): ExportSchema {
  return {
    version: '1.0.0',
    metadata: {
      name,
      createdAt: new Date().toISOString(),
      brickCount: bricks.size,
      application: 'LegoBuilder',
    },
    scene: {
      baseplate,
      bricks: Array.from(bricks.values()).map((b) => ({
        id: b.id,
        type: b.type,
        position: b.position,
        rotation: b.rotation,
        color: b.color,
      })),
    },
  };
}

export function validateImport(data: unknown): ExportSchema {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data: not an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== '1.0.0') {
    throw new Error(`Unsupported schema version: ${String(obj.version)}`);
  }

  if (!obj.metadata || !obj.scene) {
    throw new Error('Invalid import data: missing metadata or scene');
  }

  const scene = obj.scene as Record<string, unknown>;
  if (!Array.isArray(scene.bricks)) {
    throw new Error('Invalid import data: bricks must be an array');
  }

  if (scene.bricks.length > 500) {
    throw new Error('Import exceeds maximum brick count (500)');
  }

  for (const brick of scene.bricks) {
    const b = brick as Record<string, unknown>;
    if (!BRICK_CATALOG[b.type as BrickType]) {
      throw new Error(`Unknown brick type: ${String(b.type)}`);
    }
    if (!COLOR_PALETTE.includes(b.color as (typeof COLOR_PALETTE)[number])) {
      throw new Error(`Invalid color: ${String(b.color)}`);
    }
  }

  return data as ExportSchema;
}
