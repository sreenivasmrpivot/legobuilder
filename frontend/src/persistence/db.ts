import { openDB, type IDBPDatabase } from 'idb';
import type { LegoBuilderDB } from '../types/scene';

const DB_NAME = 'legobuilder';
const DB_VERSION = 1;
let dbInstance: IDBPDatabase<LegoBuilderDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<LegoBuilderDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<LegoBuilderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('scenes', { keyPath: 'id' });
      store.createIndex('by-updated', 'updatedAt');
      store.createIndex('by-name', 'name');
    },
  });
  return dbInstance;
}
