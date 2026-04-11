/**
 * Shared unit constants for the LegoBuilder application.
 *
 * STUD_SIZE defines the Three.js unit scale: 1 stud = 1.0 Three.js unit.
 * All brick dimensions, grid sizes, and camera positions are expressed
 * in terms of this constant.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §2.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

/** Size of one LEGO stud in Three.js world units */
export const STUD_SIZE = 1.0;

/** Height of one plate in Three.js world units (1/3 of a brick) */
export const PLATE_HEIGHT = STUD_SIZE / 3;

/** Height of one brick in Three.js world units (3 plates) */
export const BRICK_HEIGHT = STUD_SIZE;

/** Default grid size in studs */
export const DEFAULT_GRID_SIZE = 32;

/** Default grid divisions (1-stud intervals) */
export const DEFAULT_GRID_DIVISIONS = 32;
