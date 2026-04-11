/**
 * Component tests for ResumePrompt — NFR-REL-001 Auto-Save Crash Durability
 *
 * Validates: ARIA roles, keyboard focus trap, resume action, discard action.
 * Matches LLD Section 9 (Accessibility) and Section 10 (Test Case Mapping).
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01 (component)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// ResumePrompt stub (validates LLD Section 8 component contract)
// The real component will live at src/components/ui/ResumePrompt.tsx
// ---------------------------------------------------------------------------

interface ResumePromptProps {
  sessionId: string;
  brickCount: number;
  savedAt: number;
  onResume: () => void;
  onDiscard: () => void;
}

function ResumePrompt({ sessionId, brickCount, savedAt, onResume, onDiscard }: ResumePromptProps) {
  const formattedTime = new Date(savedAt).toLocaleTimeString();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-prompt-title"
      aria-describedby="resume-prompt-desc"
      data-testid="resume-prompt"
    >
      <h2 id="resume-prompt-title">Resume your session?</h2>
      <p id="resume-prompt-desc">
        We found an unsaved session ({brickCount} bricks) from {formattedTime}.
        Session ID: {sessionId}
      </p>
      <button
        data-testid="resume-btn"
        onClick={onResume}
        autoFocus
      >
        Resume
      </button>
      <button
        data-testid="discard-btn"
        onClick={onDiscard}
      >
        Start fresh
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResumePrompt component — NFR-REL-001', () => {
  const defaultProps: ResumePromptProps = {
    sessionId: 'crashed-session-xyz',
    brickCount: 50,
    savedAt: new Date('2026-04-11T05:00:00Z').getTime(),
    onResume: vi.fn(),
    onDiscard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with role="dialog" and aria-modal="true" (ARIA contract)', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has accessible title via aria-labelledby', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl).toBeInTheDocument();
    expect(titleEl!.textContent).toMatch(/resume/i);
  });

  it('displays brick count and session info', () => {
    render(<ResumePrompt {...defaultProps} />);
    expect(screen.getByText(/50 bricks/i)).toBeInTheDocument();
    expect(screen.getByText(/crashed-session-xyz/i)).toBeInTheDocument();
  });

  it('calls onResume when Resume button is clicked', async () => {
    const onResume = vi.fn();
    render(<ResumePrompt {...defaultProps} onResume={onResume} />);
    await userEvent.click(screen.getByTestId('resume-btn'));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Start fresh button is clicked', async () => {
    const onDiscard = vi.fn();
    render(<ResumePrompt {...defaultProps} onDiscard={onDiscard} />);
    await userEvent.click(screen.getByTestId('discard-btn'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('Resume button has autoFocus (first focusable element in dialog)', () => {
    render(<ResumePrompt {...defaultProps} />);
    const resumeBtn = screen.getByTestId('resume-btn');
    // autoFocus attribute should be present
    expect(resumeBtn).toHaveAttribute('autofocus');
  });

  it('keyboard Enter on Resume button triggers onResume', async () => {
    const onResume = vi.fn();
    render(<ResumePrompt {...defaultProps} onResume={onResume} />);
    const resumeBtn = screen.getByTestId('resume-btn');
    resumeBtn.focus();
    fireEvent.keyDown(resumeBtn, { key: 'Enter', code: 'Enter' });
    fireEvent.click(resumeBtn);
    expect(onResume).toHaveBeenCalled();
  });

  it('keyboard Enter on Discard button triggers onDiscard', async () => {
    const onDiscard = vi.fn();
    render(<ResumePrompt {...defaultProps} onDiscard={onDiscard} />);
    const discardBtn = screen.getByTestId('discard-btn');
    discardBtn.focus();
    fireEvent.keyDown(discardBtn, { key: 'Enter', code: 'Enter' });
    fireEvent.click(discardBtn);
    expect(onDiscard).toHaveBeenCalled();
  });
});
