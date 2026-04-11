/**
 * Error types for scene initialization and rendering.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §3.3
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

export type SceneErrorCode =
  | 'WEBGL_CONTEXT_LOST'
  | 'CANVAS_MOUNT_FAILED'
  | 'RENDERER_INIT_FAILED';

export class SceneInitError extends Error {
  readonly code: SceneErrorCode;

  constructor(
    code: SceneErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SceneInitError';
    this.code = code;
  }
}
