/**
 * ResumePrompt — Accessible modal for crash recovery
 *
 * Displays a dialog prompting the user to resume or discard
 * a previously auto-saved session detected at boot time.
 *
 * Accessibility:
 *   - role="dialog" with aria-modal="true"
 *   - aria-labelledby pointing to the dialog title
 *   - Focus management (Resume button auto-focused)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-05
 */

import React, { useEffect, useRef } from 'react';

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
}: ResumePromptProps): React.JSX.Element {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const savedTime = new Date(lastSavedAt).toLocaleTimeString();

  // Auto-focus the Resume button when the dialog mounts
  useEffect(() => {
    resumeButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-prompt-title"
      data-testid="resume-prompt"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2
          id="resume-prompt-title"
          className="text-lg font-semibold text-gray-900 mb-3"
        >
          Resume your session?
        </h2>

        <p className="text-gray-600 mb-6">
          Your last session was auto-saved with{' '}
          <span
            data-testid="resume-prompt-brick-count"
            className="font-medium text-gray-900"
          >
            {brickCount}
          </span>{' '}
          brick{brickCount !== 1 ? 's' : ''} at {savedTime}.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            data-testid="discard-btn"
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Discard
          </button>
          <button
            ref={resumeButtonRef}
            data-testid="resume-btn"
            onClick={onResume}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumePrompt;
