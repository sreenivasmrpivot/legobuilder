/**
 * Type definitions for project persistence and export.
 */

import type { SerializedScene } from './scene';

export interface Project {
  id: string;
  name: string;
  scene: SerializedScene;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExportMetadata {
  name: string;
  createdAt: string;
  brickCount: number;
  application: 'LegoBuilder';
}

export interface ExportFile {
  version: '1.0.0';
  metadata: ExportMetadata;
  scene: SerializedScene;
}
