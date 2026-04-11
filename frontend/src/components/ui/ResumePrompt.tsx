/**
 * ResumePrompt Component — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements the recovery dialog from LLD Section 8.
 * Displays when a crashed session is detected, offering the user
 * the choice to resume their work or start fresh.
 *
 * Accessibility (T-BE-REL-001-10):
 * - role="dialog" with aria-modal="true"
 * - aria-labelledby pointing to the dialog title
 * - autoFocus on the "Resume" button
 * - Escape key dismisses the dialog
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import React from 'react';

export interface ResumePromptProps {
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

export function ResumePrompt({
  snapshot,
  onAccept,
  onDismiss,
}: ResumePromptProps) {
  const brickCount = snapshot.data.bricks?.length ?? 0;
  const savedDate = new Date(snapshot.savedAt).toLocaleString();
  const titleId = 'resume-prompt-title';

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

export default ResumePrompt;
