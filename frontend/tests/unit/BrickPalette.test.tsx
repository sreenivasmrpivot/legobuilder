/**
 * T-FE-BUG-88-02: BrickPalette click handlers wire to uiStore
 *
 * Root Cause: RC-4 — BrickPalette.tsx click handlers not calling
 * uiStore.setActiveBrickType() / uiStore.setActiveColor()
 *
 * MUST FAIL before fix (RC-4), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-02
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrickPalette } from '../../src/components/ui/BrickPalette';

// ---------------------------------------------------------------------------
// Mock uiStore — we verify the store actions are called
// ---------------------------------------------------------------------------
const mockSetActiveBrickType = vi.fn();
const mockSetActiveColor = vi.fn();

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: unknown) => unknown) => {
    const state = {
      activeBrickType: '1x2',
      activeColor: '#FF0000',
      setActiveBrickType: mockSetActiveBrickType,
      setActiveColor: mockSetActiveColor,
    };
    return selector(state);
  },
}));

describe('T-FE-BUG-88-02 — BrickPalette wires clicks to uiStore (RC-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking a brick type button calls uiStore.setActiveBrickType with the correct type', () => {
    render(<BrickPalette />);

    // Find a brick type button — the palette must render at least one
    const brickTypeButtons = screen.getAllByRole('button', { name: /brick/i });
    expect(brickTypeButtons.length).toBeGreaterThan(0);

    // Click the first brick type button
    fireEvent.click(brickTypeButtons[0]);

    // RC-4 fix: setActiveBrickType must have been called
    expect(mockSetActiveBrickType).toHaveBeenCalledTimes(1);
    expect(mockSetActiveBrickType).toHaveBeenCalledWith(expect.any(String));
  });

  it('clicking a color swatch calls uiStore.setActiveColor with the correct hex', () => {
    render(<BrickPalette />);

    // Color swatches should have aria-label containing "color"
    const colorButtons = screen.getAllByRole('button', { name: /color/i });
    expect(colorButtons.length).toBeGreaterThan(0);

    fireEvent.click(colorButtons[0]);

    // RC-4 fix: setActiveColor must have been called
    expect(mockSetActiveColor).toHaveBeenCalledTimes(1);
    expect(mockSetActiveColor).toHaveBeenCalledWith(expect.stringMatching(/^#[0-9A-Fa-f]{6}$/));
  });

  it('active brick type button has aria-pressed=true', () => {
    render(<BrickPalette />);

    // The button matching activeBrickType='1x2' should be aria-pressed
    const activeButton = screen.getByRole('button', { name: /1x2/i });
    expect(activeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('inactive brick type buttons have aria-pressed=false', () => {
    render(<BrickPalette />);

    // Buttons that are NOT the active type should be aria-pressed=false
    const allBrickButtons = screen.getAllByRole('button', { name: /brick/i });
    const inactiveButtons = allBrickButtons.filter(
      (btn) => btn.getAttribute('aria-pressed') === 'false'
    );
    expect(inactiveButtons.length).toBeGreaterThan(0);
  });

  it('clicking a different brick type updates the active selection', () => {
    render(<BrickPalette />);

    const brickTypeButtons = screen.getAllByRole('button', { name: /brick/i });
    // Click each button and verify setActiveBrickType is called each time
    brickTypeButtons.forEach((btn, idx) => {
      fireEvent.click(btn);
      expect(mockSetActiveBrickType).toHaveBeenCalledTimes(idx + 1);
    });
  });
});
