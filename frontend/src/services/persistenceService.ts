/**
 * Service: PersistenceService
 *
 * Manages IndexedDB operations for project save/load using the idb wrapper.
 * Schema defined in TECHNICAL_ARCHITECTURE.md Section 3.1.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

const DB_NAME = 'legobuilder';
const DB_VERSION = 1;
const MAX_PROJECTS = 5;

export interface ProjectRecord {
  id: string;
  name: string;
  scene: unknown; // SerializedScene — typed in feature branch
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
}

export const persistenceService = {
  async saveProject(_project: ProjectRecord): Promise<void> {
    // TODO: Implement with idb in feature branch
    // 1. Open DB
    // 2. Put project record
    // 3. Enforce MAX_PROJECTS limit
  },

  async loadProject(_id: string): Promise<ProjectRecord | undefined> {
    // TODO: Implement with idb in feature branch
    return undefined;
  },

  async listProjects(): Promise<ProjectRecord[]> {
    // TODO: Implement with idb in feature branch
    return [];
  },

  async deleteProject(_id: string): Promise<void> {
    // TODO: Implement with idb in feature branch
  },

  DB_NAME,
  DB_VERSION,
  MAX_PROJECTS,
};
