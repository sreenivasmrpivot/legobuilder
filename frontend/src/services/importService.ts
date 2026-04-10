/**
 * Service: ImportService
 *
 * Reads a JSON file, validates it against ExportSchema, and loads
 * the scene into the store. Includes strict sanitization per
 * TECHNICAL_ARCHITECTURE.md Section 5.2.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import type { ExportSchema } from '../engine/exportSchema';

export const importService = {
  /**
   * Import a scene from a JSON file.
   * @throws Error if validation fails
   */
  async importScene(_file: File): Promise<ExportSchema> {
    // TODO: Implement in feature branch
    // 1. Read file as text
    // 2. Parse JSON
    // 3. Validate against ExportSchema
    // 4. Sanitize (no eval, no innerHTML)
    // 5. Validate brick types, colors, positions
    // 6. Return validated schema
    throw new Error('Not implemented — scaffold stub');
  },
};
