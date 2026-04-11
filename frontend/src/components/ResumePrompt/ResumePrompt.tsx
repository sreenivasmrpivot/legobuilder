/**
 * ResumePrompt Component — NFR-REL-001
 *
 * Accessible modal dialog shown when a crash recovery candidate is
 * detected at boot time. Displays the brick count and last save time,
 * with Resume and Discard actions.
 *
 * Contract tested by:
 *   T-UNIT-REL-001-05  Renders with correct brick count, a11y, callbacks
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-05
 */
import React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResumePromptProps {
  brickCount: number;
  lastSavedAt: number;
  onResume: () => void;
  onDiscard: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResumePrompt({
  brickCount,
  lastSavedAt,
  onResume,
  onDiscard,
}: ResumePromptProps): React.ReactElement {
  const savedTime = new Date(lastSavedAt).toLocaleTimeString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-prompt-title"
      data-testid="resume-prompt"
    >
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2
          id="resume-prompt-title"
          className="mb-4 text-xl font-semibold text-gray-900"
        >
          Resume your session?
        </h2>

        <p className="mb-6 text-gray-600">
          Your last session was auto-saved with{' '}
          <span
            className="font-bold text-blue-600"
            data-testid="resume-prompt-brick-count"
          >
            {brickCount}
          </span>{' '}
          brick{brickCount !== 1 ? 's' : ''} at {savedTime}.
        </p>

        <div className="flex gap-3">
          <button
            data-testid="resume-btn"
            onClick={onResume}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Resume
          </button>
          <button
            data-testid="discard-btn"
            onClick={onDiscard}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumePrompt;
