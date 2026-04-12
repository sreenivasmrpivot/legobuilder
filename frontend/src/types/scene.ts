import type { DBSchema } from 'idb';
import type { Brick } from './brick';

export interface SceneRecord {
  id: string;
  name: string;
  bricks: Record<string, Brick>;
  gridSize: [number, number];
  brickCount: number;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface SceneMetadata {
  id: string;
  name: string;
  brickCount: number;
  thumbnail: string;
  updatedAt: string;
}

export interface LegoBuilderDB extends DBSchema {
  scenes: {
    key: string;
    value: SceneRecord;
    indexes: {
      'by-updated': string;
      'by-name': string;
    };
  };
}
