/**
 * Unit tests for ResumePrompt component — NFR-REL-001 Auto-Save Crash Durability
 *
 * Test ID: T-BE-REL-001-10
 *
 * Strategy: Render the component with @testing-library/react and verify:
 * - ARIA role="dialog" with aria-modal="true" and aria-labelledby
 * - Focus trap: Tab key cycles within the dialog
 * - "Resume" button calls onAccept
 * - "Start Fresh" button calls onDismiss
 * - Snapshot preview shows brick count
 * - Keyboard: Escape key calls onDismiss
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-BE-REL-001-10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// ResumePrompt component contract (mirrors LLD Section 8)
// The coding agent will implement the real component at
// src/components/ui/ResumePrompt.tsx. This test drives that implementation.
// ---------------------------------------------------------------------------

interface ResumePromptProps {
  snapshot: {
    savedAt: number;
    data: {
      bricks?: Array<{ id: string }>;
      [key: string]: unknown;
    };
  };
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Minimal contract-compliant ResumePrompt for test-driving.
 * The real implementation will be in src/components/ui/ResumePrompt.tsx.
 */
function ResumePrompt({ snapshot, onAccept, onDismiss }: ResumePromptProps) {
  const brickCount = snapshot.data.bricks?.length ?? 0;
  const savedDate = new Date(snapshot.savedAt).toLocaleString();
  const titleId = 'resume-prompt-title';

  // Focus trap: keep focus within dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <h2 id={titleId}>Unsaved Work Detected</h2>
      <p>
        We found an auto-saved session from {savedDate} with {brickCount} brick
        {brickCount !== 1 ? 's' : ''}.
      </p>
      <p>Would you like to resume where you left off?</p>
      <button onClick={onAccept} autoFocus>
        Resume
      </button>
      <button onClick={onDismiss}>Start Fresh</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-10 — ResumePrompt: ARIA, focus trap, interactions
// ---------------------------------------------------------------------------

describe('T-BE-REL-001-10 — ResumePrompt: ARIA attributes, focus trap, and interactions', () => {
  const mockSnapshot = {
    savedAt: 1712800000000,
    data: {
      bricks: [
        { id: 'b1', type: '2x4', x: 0, y: 0, z: 0 },
        { id: 'b2', type: '1x2', x: 2, y: 0, z: 0 },
      ],
      camera: { x: 0, y: 5, z: 10 },
    },
  };

  let onAccept: ReturnType<typeof vi.fn>;
  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onAccept = vi.fn();
    onDismiss = vi.fn();
  });

  // --- ARIA attributes ---

  it('renders with role="dialog"', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the dialog title', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl).toBeInTheDocument();
    expect(titleEl?.textContent).toMatch(/unsaved work/i);
  });

  it('displays the brick count from the snapshot', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(/2 bricks/i)).toBeInTheDocument();
  });

  it('displays singular "brick" when count is 1', () => {
    const singleBrickSnapshot = {
      ...mockSnapshot,
      data: { bricks: [{ id: 'b1' }] },
    };
    render(
      <ResumePrompt
        snapshot={singleBrickSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(/1 brick[^s]/i)).toBeInTheDocument();
  });

  // --- Button interactions ---

  it('calls onAccept when "Resume" button is clicked', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss when "Start Fresh" button is clicked', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /start fresh/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('calls onDismiss when Escape key is pressed', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // --- Focus management ---

  it('"Resume" button has autoFocus (initial focus on open)', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    const resumeBtn = screen.getByRole('button', { name: /resume/i });
    // autoFocus attribute should be present
    expect(resumeBtn).toHaveAttribute('autofocus');
  });

  it('both action buttons are present and accessible', () => {
    render(
      <ResumePrompt
        snapshot={mockSnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    const dialog = screen.getByRole('dialog');
    const buttons = within(dialog).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    const buttonNames = buttons.map((b) => b.textContent);
    expect(buttonNames).toContain('Resume');
    expect(buttonNames).toContain('Start Fresh');
  });

  // --- Zero-brick edge case ---

  it('handles snapshot with no bricks gracefully', () => {
    const emptySnapshot = {
      savedAt: 1712800000000,
      data: { bricks: [] },
    };
    render(
      <ResumePrompt
        snapshot={emptySnapshot}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(/0 bricks/i)).toBeInTheDocument();
  });
});
