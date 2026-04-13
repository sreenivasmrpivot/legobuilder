/**
 * T-FE-BUG-88-06b: CSS pointer-events audit — no blocking styles on canvas
 *
 * Root Cause: RC-6 — CSS pointer-events: none or invisible overlay div
 * blocking all pointer events at the DOM level.
 *
 * MUST FAIL before fix (RC-6), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-06
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Read the actual CSS file and ViewportCanvas source to audit for
// pointer-events: none patterns that would block interaction.
// ---------------------------------------------------------------------------

const CSS_FILE = path.resolve(__dirname, '../../src/index.css');
const VIEWPORT_CANVAS_FILE = path.resolve(
  __dirname,
  '../../src/components/viewport/ViewportCanvas.tsx'
);

describe('T-FE-BUG-88-06b — CSS pointer-events audit (RC-6)', () => {
  it('index.css does not contain pointer-events: none on canvas or container', () => {
    const css = fs.readFileSync(CSS_FILE, 'utf-8');

    // RC-6 fix: no blanket pointer-events: none on canvas or container
    const problematicPatterns = [
      /canvas\s*\{[^}]*pointer-events\s*:\s*none/,
      /\.canvas-container\s*\{[^}]*pointer-events\s*:\s*none/,
      /\.viewport\s*\{[^}]*pointer-events\s*:\s*none/,
    ];

    for (const pattern of problematicPatterns) {
      expect(
        pattern.test(css),
        `index.css must not contain pointer-events: none on canvas/container. Pattern: ${pattern}`
      ).toBe(false);
    }
  });

  it('ViewportCanvas.tsx does not set pointerEvents: none inline on wrapper div', () => {
    const source = fs.readFileSync(VIEWPORT_CANVAS_FILE, 'utf-8');

    // RC-6 fix: no inline style={{ pointerEvents: 'none' }} on wrapper
    expect(
      source.includes("pointerEvents: 'none'"),
      "ViewportCanvas.tsx must not set pointerEvents: 'none' inline"
    ).toBe(false);

    expect(
      source.includes('pointer-events: none'),
      'ViewportCanvas.tsx must not set pointer-events: none inline'
    ).toBe(false);
  });

  it('ViewportCanvas.tsx accepts and forwards pointer event props to Canvas', () => {
    const source = fs.readFileSync(VIEWPORT_CANVAS_FILE, 'utf-8');

    // RC-1 + RC-6 fix: ViewportCanvas must accept onPointerDown/Move/Up props
    expect(
      source.includes('onPointerDown'),
      'ViewportCanvas must accept onPointerDown prop'
    ).toBe(true);

    expect(
      source.includes('onPointerMove'),
      'ViewportCanvas must accept onPointerMove prop'
    ).toBe(true);

    expect(
      source.includes('onPointerUp'),
      'ViewportCanvas must accept onPointerUp prop'
    ).toBe(true);
  });

  it('index.css does not have a global * { pointer-events: none } rule', () => {
    const css = fs.readFileSync(CSS_FILE, 'utf-8');

    expect(
      /\*\s*\{[^}]*pointer-events\s*:\s*none/.test(css),
      'index.css must not have a global pointer-events: none rule'
    ).toBe(false);
  });
});
