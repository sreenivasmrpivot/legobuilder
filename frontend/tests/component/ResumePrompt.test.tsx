/**
 * Component Test: ResumePrompt
 *
 * Test ID:
 *   T-UNIT-REL-001-05  ResumePrompt renders with correct brick count
 *
 * M1 FIX: Now imports the real production ResumePrompt component
 * instead of defining an inline stub.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-05
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// M1 FIX: Import real production component
import { ResumePrompt } from '../../src/components/ResumePrompt/ResumePrompt';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('T-UNIT-REL-001-05: ResumePrompt — renders with correct brick count', () => {
  it('displays the correct brick count', () => {
    render(
      <ResumePrompt
        brickCount={50}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const brickCountEl = screen.getByTestId('resume-prompt-brick-count');
    expect(brickCountEl).toHaveTextContent('50');
  });

  it('renders with brickCount=0 without crashing', () => {
    render(
      <ResumePrompt
        brickCount={0}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.getByTestId('resume-prompt-brick-count')).toHaveTextContent('0');
  });

  it('renders with brickCount=1 using singular "brick"', () => {
    render(
      <ResumePrompt
        brickCount={1}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.getByText(/1 brick at/)).toBeInTheDocument();
  });

  it('renders with brickCount=2 using plural "bricks"', () => {
    render(
      <ResumePrompt
        brickCount={2}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.getByText(/2 bricks at/)).toBeInTheDocument();
  });
});

describe('ResumePrompt — accessibility', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <ResumePrompt
        brickCount={10}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the dialog title', () => {
    render(
      <ResumePrompt
        brickCount={10}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl).toBeInTheDocument();
    expect(titleEl!.textContent).toMatch(/resume/i);
  });

  it('renders both Resume and Discard buttons', () => {
    render(
      <ResumePrompt
        brickCount={10}
        lastSavedAt={Date.now()}
        onResume={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(screen.getByTestId('resume-btn')).toBeInTheDocument();
    expect(screen.getByTestId('discard-btn')).toBeInTheDocument();
  });
});

describe('ResumePrompt — interaction', () => {
  it('calls onResume when Resume button is clicked', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ResumePrompt
        brickCount={10}
        lastSavedAt={Date.now()}
        onResume={onResume}
        onDiscard={onDiscard}
      />,
    );

    fireEvent.click(screen.getByTestId('resume-btn'));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('calls onDiscard when Discard button is clicked', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ResumePrompt
        brickCount={10}
        lastSavedAt={Date.now()}
        onResume={onResume}
        onDiscard={onDiscard}
      />,
    );

    fireEvent.click(screen.getByTestId('discard-btn'));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
  });

  it('does not call onResume when Discard is clicked', () => {
    const onResume = vi.fn();

    render(
      <ResumePrompt
        brickCount={5}
        lastSavedAt={Date.now()}
        onResume={onResume}
        onDiscard={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('discard-btn'));
    expect(onResume).not.toHaveBeenCalled();
  });
});
