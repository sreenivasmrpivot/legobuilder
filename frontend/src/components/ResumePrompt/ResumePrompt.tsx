/**
 * ResumePrompt — Accessible crash recovery dialog
 *
 * Displays a modal dialog when a crashed session is detected,
 * showing the brick count and offering Resume/Discard options.
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
}: ResumePromptProps): React.JSX.Element {
  const savedTime = new Date(lastSavedAt).toLocaleTimeString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-prompt-title"
      data-testid="resume-prompt"
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
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h2 id="resume-prompt-title" style={{ margin: '0 0 12px 0' }}>
          Resume your session?
        </h2>
        <p style={{ margin: '0 0 20px 0', color: '#555' }}>
          Your last session was auto-saved with{' '}
          <span data-testid="resume-prompt-brick-count" style={{ fontWeight: 'bold' }}>
            {brickCount}
          </span>{' '}
          brick{brickCount !== 1 ? 's' : ''} at {savedTime}.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            data-testid="discard-btn"
            onClick={onDiscard}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Discard
          </button>
          <button
            data-testid="resume-btn"
            onClick={onResume}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumePrompt;
