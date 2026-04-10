/**
 * Service: ExportService
 *
 * Serializes the current scene to the versioned JSON ExportSchema
 * and triggers a file download.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import type { ExportSchema } from '../engine/exportSchema';

export const exportService = {
  /**
   * Export the current scene as a JSON file download.
   */
  async exportScene(_scene: ExportSchema): Promise<void> {
    // TODO: Implement in feature branch
    // 1. Serialize scene to ExportSchema JSON
    // 2. Create Blob
    // 3. Trigger download via anchor element
  },
};
