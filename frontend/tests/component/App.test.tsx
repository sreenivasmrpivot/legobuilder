/**
 * Component test: App
 *
 * Verifies the root App component renders the main layout
 * with viewport and UI panels.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/components/App';

describe('App', () => {
  it('renders the application shell', () => {
    render(<App />);
    expect(screen.getByTestId('app-shell')).toBeDefined();
  });

  it('renders the toolbar', () => {
    render(<App />);
    expect(screen.getByTestId('toolbar')).toBeDefined();
  });
});
