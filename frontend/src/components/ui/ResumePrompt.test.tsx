/**
 * NFR-REL-001 — Auto-Save Crash Durability
 * Component tests for ResumePrompt
 *
 * Test IDs:
 *   T-UNIT-REL-001-05: ResumePrompt renders with correct ARIA attributes
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Iteration: 3
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumePrompt } from './ResumePrompt';

const MOCK_BRICK_COUNT = 42;
const MOCK_ON_RESUME = vi.fn();
const MOCK_ON_DISCARD = vi.fn();

describe('T-UNIT-REL-001-05: ResumePrompt — ARIA attributes and rendering', () => {
  it('renders with role="dialog" and aria-modal="true"', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the dialog title', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();

    const titleElement = document.getElementById(labelledById!);
    expect(titleElement).toBeInTheDocument();
  });

  it('displays the correct brick count', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('has a Resume button with data-testid="resume-btn"', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    const resumeBtn = screen.getByTestId('resume-btn');
    expect(resumeBtn).toBeInTheDocument();
  });

  it('has a Discard button with data-testid="discard-btn"', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    const discardBtn = screen.getByTestId('discard-btn');
    expect(discardBtn).toBeInTheDocument();
  });

  it('calls onResume when Resume button is clicked', () => {
    const onResume = vi.fn();
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={onResume}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    fireEvent.click(screen.getByTestId('resume-btn'));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('calls onDiscard when Discard button is clicked', () => {
    const onDiscard = vi.fn();
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={onDiscard}
      />
    );

    fireEvent.click(screen.getByTestId('discard-btn'));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('has data-testid="resume-prompt" on the dialog container', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    expect(screen.getByTestId('resume-prompt')).toBeInTheDocument();
  });

  it('displays brick count in data-testid="resume-prompt-brick-count" span', () => {
    render(
      <ResumePrompt
        brickCount={MOCK_BRICK_COUNT}
        onResume={MOCK_ON_RESUME}
        onDiscard={MOCK_ON_DISCARD}
      />
    );

    const brickCountEl = screen.getByTestId('resume-prompt-brick-count');
    expect(brickCountEl).toBeInTheDocument();
    expect(brickCountEl.textContent).toContain('42');
  });
});
