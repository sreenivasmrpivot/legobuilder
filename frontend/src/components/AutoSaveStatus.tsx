/**
 * AutoSaveStatus Component — NFR-REL-001
 *
 * Displays the current auto-save status indicator.
 * Uses data-testid="auto-save-status" for E2E test contract.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-BE-REL-001-01, T-BE-REL-001-02
 */

import React from 'react';
import { usePersistenceStore, type AutoSaveStatus as AutoSaveStatusType } from '../stores/persistenceStore';

const STATUS_LABELS: Record<AutoSaveStatusType, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save failed',
};

const STATUS_COLORS: Record<AutoSaveStatusType, string> = {
  idle: '#888',
  saving: '#f59e0b',
  saved: '#22c55e',
  error: '#ef4444',
};

export function AutoSaveStatus(): React.ReactElement | null {
  const autoSaveStatus = usePersistenceStore((s) => s.autoSaveStatus);

  const label = STATUS_LABELS[autoSaveStatus];
  if (!label) return null;

  return (
    <span
      data-testid="auto-save-status"
      style={{
        fontSize: '12px',
        color: STATUS_COLORS[autoSaveStatus],
        padding: '4px 8px',
      }}
    >
      {label}
    </span>
  );
}

export default AutoSaveStatus;
