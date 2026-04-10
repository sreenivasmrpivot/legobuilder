/**
 * Engine: SelectionManager
 *
 * Pure logic for managing brick selection — multi-select, box select,
 * and selection-based operations (delete, color change, rotate).
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

export class SelectionManager {
  /**
   * Get bricks within a rectangular screen-space selection box.
   * Used for drag-to-select functionality.
   */
  static getIdsInBox(
    _allBrickIds: string[],
    _boxStart: [number, number],
    _boxEnd: [number, number]
  ): string[] {
    // TODO: Implement in feature branch
    // Project brick positions to screen space and filter by box bounds
    return [];
  }
}
