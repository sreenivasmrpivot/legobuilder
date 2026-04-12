import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '../../src/components/layout/AppShell';

describe('AppShell', () => {
  it('should render the app title', () => {
    render(<AppShell />);
    expect(screen.getByText('LegoBuilder')).toBeInTheDocument();
  });
  it('should render the toolbar', () => {
    render(<AppShell />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });
  it('should render the brick palette', () => {
    render(<AppShell />);
    expect(screen.getByTestId('brick-palette')).toBeInTheDocument();
  });
  it('should render the scene canvas stub', () => {
    render(<AppShell />);
    expect(screen.getByTestId('scene-canvas')).toBeInTheDocument();
  });
});
