/**
 * ResumePrompt Component — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements the recovery dialog defined in LLD Section 8.
 *
 * Accessibility:
 * - role="dialog" with aria-modal="true"
 * - aria-labelledby pointing to the dialog title
 * - Escape key dismisses the dialog
 * - Resume button has autoFocus for keyboard accessibility
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

export function ResumePrompt({ snapshot, onAccept, onDismiss }: ResumePromptProps) {
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h2 id={titleId}>Unsaved Work Detected</h2>
        <p>
          We found an auto-saved session from {savedDate} with {brickCount} brick
          {brickCount !== 1 ? 's' : ''}.
        </p>
        <p>Would you like to resume where you left off?</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={onAccept}
            autoFocus
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Resume
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 20px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumePrompt;
