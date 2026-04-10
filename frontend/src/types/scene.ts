/**
 * Type definitions for scene-level data structures.
 */

import type { Brick, BrickType } from './brick';

export interface Baseplate {
  width: number;
  depth: number;
}

export interface Scene {
  bricks: Map<string, Brick>;
  baseplate: Baseplate;
}

export interface SerializedScene {
  baseplate: Baseplate;
  bricks: Array<{
    id: string;
    type: BrickType;
    position: [number, number, number];
    rotation: number;
    color: string;
  }>;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  brickCount: number;
}
