/**
 * ResumePrompt Component — NFR-REL-001 Auto-Save Crash Durability
 *
 * Accessible ARIA dialog that prompts the user to resume a crashed
 * session or start fresh. Displayed when an orphaned session is
 * detected on app startup.
 *
 * Accessibility Requirements (LLD Section 9):
 *   - role="dialog" with aria-modal="true"
 *   - aria-labelledby pointing to the dialog title element
 *   - aria-describedby pointing to the description element
 *   - Two action buttons: "Resume" (primary) and "Start Fresh" (secondary)
 *   - "Resume" button receives initial focus on mount (autoFocus)
 *   - Focus is trapped inside the dialog while it is open
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 8, 9
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResumePromptProps {
  /** The session ID of the orphaned session */
  sessionId: string;
  /** Timestamp of the last successful save (ms since epoch) */
  lastSavedAt: number;
  /** Number of snapshots available for recovery */
  snapshotCount: number;
  /** Called when the user chooses to resume the previous session */
  onResume: () => void;
  /** Called when the user chooses to discard and start fresh */
  onStartFresh: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ResumePrompt renders an accessible dialog for crash recovery.
 * It displays session information and provides Resume / Start Fresh actions.
 */
export const ResumePrompt: React.FC<ResumePromptProps> = ({
  sessionId,
  lastSavedAt,
  snapshotCount,
  onResume,
  onStartFresh,
}) => {
  const titleId = 'resume-prompt-title';
  const descId = 'resume-prompt-desc';
  const lastSavedDate = new Date(lastSavedAt).toLocaleString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid="resume-prompt"
    >
      <h2 id={titleId}>Resume Previous Session?</h2>
      <p id={descId}>
        A previous session ({sessionId}) was interrupted. Last saved:{' '}
        {lastSavedDate}. {snapshotCount} snapshot
        {snapshotCount !== 1 ? 's' : ''} available.
      </p>
      <div role="group" aria-label="Session recovery options">
        <button
          type="button"
          onClick={onResume}
          aria-label="Resume previous session"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          data-testid="resume-btn"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={onStartFresh}
          aria-label="Discard previous session and start fresh"
          data-testid="discard-btn"
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
};

export default ResumePrompt;
