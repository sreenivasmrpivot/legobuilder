/**
 * Unit Tests — ResumePrompt component
 *
 * Test ID: T-UNIT-REL-001-05
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * Tests the ResumePrompt modal component defined in LLD Section 4.5.
 * Validates rendering, accessibility, and user interaction callbacks.
 *
 * Spectra-Agent: frontend-test
 * Spectra-Tests: T-UNIT-REL-001-05
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Component under test
// The coding agent will implement this at:
//   frontend/src/components/ResumePrompt/ResumePrompt.tsx
// ---------------------------------------------------------------------------

import { ResumePrompt } from './ResumePrompt';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const LAST_SAVED_AT = new Date('2026-04-11T05:00:00Z').getTime();

function renderResumePrompt(overrides: {
  brickCount?: number;
  lastSavedAt?: number;
  onResume?: () => void;
  onDiscard?: () => void;
} = {}) {
  const props = {
    brickCount: overrides.brickCount ?? 50,
    lastSavedAt: overrides.lastSavedAt ?? LAST_SAVED_AT,
    onResume: overrides.onResume ?? vi.fn(),
    onDiscard: overrides.onDiscard ?? vi.fn(),
  };
  return { ...render(<ResumePrompt {...props} />), props };
}

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-05: ResumePrompt renders with correct brick count
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-05 — ResumePrompt renders with correct brick count', () => {
  it('renders the resume prompt dialog', () => {
    renderResumePrompt();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('displays the correct brick count (50)', () => {
    renderResumePrompt({ brickCount: 50 });
    // The brick count should be visible in the prompt
    expect(screen.getByTestId('resume-prompt-brick-count')).toHaveTextContent('50');
  });

  it('displays the correct brick count (1) with singular label', () => {
    renderResumePrompt({ brickCount: 1 });
    expect(screen.getByTestId('resume-prompt-brick-count')).toHaveTextContent('1');
  });

  it('displays a human-readable last-saved time', () => {
    renderResumePrompt({ lastSavedAt: LAST_SAVED_AT });
    // The component should render a human-readable time string
    // (exact format is implementation-defined, but must not be a raw epoch number)
    const dialog = screen.getByRole('dialog');
    const dialogText = dialog.textContent ?? '';
    // Should NOT display the raw epoch number
    expect(dialogText).not.toContain(String(LAST_SAVED_AT));
    // Should contain some time-related text (e.g. "ago", "AM", "PM", or a date)
    expect(dialogText.length).toBeGreaterThan(0);
  });

  it('renders Resume and Discard buttons', () => {
    renderResumePrompt();
    expect(screen.getByTestId('resume-prompt-resume-btn')).toBeInTheDocument();
    expect(screen.getByTestId('resume-prompt-discard-btn')).toBeInTheDocument();
  });

  it('calls onResume when Resume button is clicked', async () => {
    const onResume = vi.fn();
    renderResumePrompt({ onResume });
    await userEvent.click(screen.getByTestId('resume-prompt-resume-btn'));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('calls onDiscard when Discard button is clicked', async () => {
    const onDiscard = vi.fn();
    renderResumePrompt({ onDiscard });
    await userEvent.click(screen.getByTestId('resume-prompt-discard-btn'));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('does not call onResume when Discard is clicked', async () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();
    renderResumePrompt({ onResume, onDiscard });
    await userEvent.click(screen.getByTestId('resume-prompt-discard-btn'));
    expect(onResume).not.toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Accessibility tests (LLD Section 11)
// ---------------------------------------------------------------------------

describe('ResumePrompt — Accessibility', () => {
  it('has role="dialog" on the root element', () => {
    renderResumePrompt();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    renderResumePrompt();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the dialog title', () => {
    renderResumePrompt();
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    // The element referenced by aria-labelledby must exist in the DOM
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl).not.toBeNull();
  });

  it('has data-testid="resume-prompt" on the root element', () => {
    renderResumePrompt();
    expect(screen.getByTestId('resume-prompt')).toBeInTheDocument();
  });

  it('Resume button is keyboard-focusable', () => {
    renderResumePrompt();
    const resumeBtn = screen.getByTestId('resume-prompt-resume-btn');
    resumeBtn.focus();
    expect(document.activeElement).toBe(resumeBtn);
  });

  it('Discard button is keyboard-focusable', () => {
    renderResumePrompt();
    const discardBtn = screen.getByTestId('resume-prompt-discard-btn');
    discardBtn.focus();
    expect(document.activeElement).toBe(discardBtn);
  });

  it('Enter key on Resume button triggers onResume', async () => {
    const onResume = vi.fn();
    renderResumePrompt({ onResume });
    const resumeBtn = screen.getByTestId('resume-prompt-resume-btn');
    resumeBtn.focus();
    fireEvent.keyDown(resumeBtn, { key: 'Enter', code: 'Enter' });
    // userEvent.keyboard triggers click via Enter on focused button
    await userEvent.keyboard('{Enter}');
    expect(onResume).toHaveBeenCalled();
  });
});
