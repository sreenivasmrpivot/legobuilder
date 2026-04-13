/**
 * T-FE-BUG-88-04b: App.tsx mounts useKeyboardShortcuts (RC-2 integration)
 *
 * Verifies that App.tsx actually calls useKeyboardShortcuts() so that
 * keyboard events are active when the app is rendered.
 *
 * MUST FAIL before fix (RC-2), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-04
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Spy on useKeyboardShortcuts to verify it is called by App
// ---------------------------------------------------------------------------
const mockUseKeyboardShortcuts = vi.fn();

vi.mock('../../src/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: mockUseKeyboardShortcuts,
}));

// Stub out heavy dependencies so App renders without WebGL
vi.mock('../../src/components/viewport/Viewport', () => ({
  Viewport: () => null,
}));

vi.mock('../../src/components/ui/Toolbar', () => ({
  Toolbar: () => null,
}));

vi.mock('../../src/components/ui/BrickPalette', () => ({
  BrickPalette: () => null,
}));

vi.mock('../../src/hooks/useAutoSave', () => ({
  useAutoSave: vi.fn(),
}));

vi.mock('../../src/components/ui/ResumePrompt', () => ({
  ResumePrompt: () => null,
}));

describe('T-FE-BUG-88-04b — App.tsx mounts useKeyboardShortcuts (RC-2)', () => {
  it('App renders and calls useKeyboardShortcuts()', () => {
    // Dynamic import to avoid module-level side effects
    const { App } = require('../../src/components/App');

    render(<App />);

    // RC-2 fix: useKeyboardShortcuts must be called when App mounts
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledTimes(1);
  });
});
