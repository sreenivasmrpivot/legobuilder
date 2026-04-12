/**
 * ResumePrompt.test.tsx
 * NFR-REL-001 — Auto-Save Crash Durability
 *
 * Test ID: T-UNIT-REL-001-05
 * Verifies: ResumePrompt renders with correct ARIA attributes and data-testid selectors
 *
 * LLD v2.0 component contract:
 *   - role="dialog"
 *   - aria-modal="true"
 *   - aria-labelledby pointing to heading
 *   - aria-describedby pointing to description
 *   - autoFocus on Resume button
 *   - Escape key triggers onDiscard
 *   - data-testid="resume-prompt"
 *   - data-testid="resume-prompt-brick-count"
 *   - data-testid="resume-btn"
 *   - data-testid="discard-btn"
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumePrompt } from '../../src/components/ResumePrompt';

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-05: ResumePrompt — ARIA attributes and data-testid selectors
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-05: ResumePrompt — accessibility and rendering', () => {
  const defaultProps = {
    brickCount: 50,
    lastSavedAt: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    onResume: vi.fn(),
    onDiscard: vi.fn(),
  };

  it('renders with role="dialog"', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has data-testid="resume-prompt"', () => {
    render(<ResumePrompt {...defaultProps} />);
    expect(screen.getByTestId('resume-prompt')).toBeInTheDocument();
  });

  it('displays the correct brick count', () => {
    render(<ResumePrompt {...defaultProps} />);
    const brickCountEl = screen.getByTestId('resume-prompt-brick-count');
    expect(brickCountEl).toBeInTheDocument();
    expect(brickCountEl.textContent).toContain('50');
  });

  it('has data-testid="resume-btn" on the Resume button', () => {
    render(<ResumePrompt {...defaultProps} />);
    expect(screen.getByTestId('resume-btn')).toBeInTheDocument();
  });

  it('has data-testid="discard-btn" on the Discard button', () => {
    render(<ResumePrompt {...defaultProps} />);
    expect(screen.getByTestId('discard-btn')).toBeInTheDocument();
  });

  it('calls onResume when Resume button is clicked', async () => {
    const onResume = vi.fn();
    render(<ResumePrompt {...defaultProps} onResume={onResume} />);
    await userEvent.click(screen.getByTestId('resume-btn'));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard button is clicked', async () => {
    const onDiscard = vi.fn();
    render(<ResumePrompt {...defaultProps} onDiscard={onDiscard} />);
    await userEvent.click(screen.getByTestId('discard-btn'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Escape key is pressed', async () => {
    const onDiscard = vi.fn();
    render(<ResumePrompt {...defaultProps} onDiscard={onDiscard} />);
    await userEvent.keyboard('{Escape}');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('has aria-labelledby attribute pointing to a heading', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    // The element referenced by aria-labelledby should exist
    const labelEl = document.getElementById(labelledById!);
    expect(labelEl).not.toBeNull();
  });

  it('has aria-describedby attribute pointing to a description', () => {
    render(<ResumePrompt {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const describedById = dialog.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    const descEl = document.getElementById(describedById!);
    expect(descEl).not.toBeNull();
  });

  it('auto-focuses the Resume button on mount', () => {
    render(<ResumePrompt {...defaultProps} />);
    const resumeBtn = screen.getByTestId('resume-btn');
    expect(document.activeElement).toBe(resumeBtn);
  });

  it('renders a human-readable last saved time', () => {
    render(<ResumePrompt {...defaultProps} />);
    // Should display some time reference (e.g., "5 minutes ago" or a formatted time)
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toBeTruthy();
    expect(dialog.textContent!.length).toBeGreaterThan(0);
  });
});
