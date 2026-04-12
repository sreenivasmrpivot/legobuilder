import { getDB } from './db';
import type { SceneRecord, SceneMetadata } from '../types/scene';

export const sceneRepository = {
  async save(scene: SceneRecord): Promise<void> {
    const db = await getDB();
    await db.put('scenes', { ...scene, updatedAt: new Date().toISOString() });
  },
  async load(id: string): Promise<SceneRecord | undefined> {
    const db = await getDB();
    return db.get('scenes', id);
  },
  async list(): Promise<SceneMetadata[]> {
    const db = await getDB();
    const scenes = await db.getAllFromIndex('scenes', 'by-updated');
    return scenes.reverse().map(({ id, name, brickCount, thumbnail, updatedAt }) => ({ id, name, brickCount, thumbnail, updatedAt }));
  },
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('scenes', id);
  },
};
