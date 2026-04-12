/**
 * T-A11Y-A11Y-001-01 & T-A11Y-A11Y-001-03 & T-A11Y-A11Y-001-04
 * NFR-A11Y-001: Keyboard Navigation for Toolbar
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding adds
 * ARIA attributes and role="toolbar" to src/components/ui/Toolbar.tsx
 *
 * Test coverage:
 * - T-A11Y-A11Y-001-01: Tab through all 7 toolbar buttons in DOM order
 * - T-A11Y-A11Y-001-03: Enter key triggers button action
 * - T-A11Y-A11Y-001-04: Zero axe-core WCAG 2.1 AA violations (jest-axe)
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-A11Y-001
 * Spectra-Tests: T-A11Y-A11Y-001-01, T-A11Y-A11Y-001-03, T-A11Y-A11Y-001-04
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend expect with jest-axe matcher
expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Component under test
// The Toolbar component must be updated by frontend-coding to include:
// - role="toolbar" on the container
// - aria-label="Editor Toolbar" on the container
// - aria-label on each button (e.g., "Add Brick", "Delete Brick", etc.)
// - type="button" on each button
// ---------------------------------------------------------------------------
import Toolbar from '../../src/components/ui/Toolbar';

// ---------------------------------------------------------------------------
// Mock props — Toolbar requires 7 action callbacks
// ---------------------------------------------------------------------------
const mockProps = {
  onAddBrick: vi.fn(),
  onDeleteBrick: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onSave: vi.fn(),
  onLoad: vi.fn(),
  onExport: vi.fn(),
};

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-01: Tab through all 7 toolbar buttons in DOM order
// ---------------------------------------------------------------------------
describe('Toolbar — T-A11Y-A11Y-001-01: Tab navigation through 7 buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a toolbar container with role="toolbar"', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeDefined();
  });

  it('toolbar container has aria-label="Editor Toolbar"', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar', { name: /editor toolbar/i });
    expect(toolbar).toBeDefined();
  });

  it('renders exactly 7 buttons inside the toolbar', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    expect(buttons).toHaveLength(7);
  });

  it('all 7 buttons are native <button> elements (not div/span)', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.tagName.toLowerCase()).toBe('button');
    });
  });

  it('all 7 buttons have accessible names (aria-label)', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    buttons.forEach((btn) => {
      // Each button must have a non-empty accessible name
      const name = btn.getAttribute('aria-label') || btn.textContent || '';
      expect(name.trim().length).toBeGreaterThan(0);
    });
  });

  it('Tab key moves focus through all 7 buttons in DOM order', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    // Focus the first button
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    // Tab through remaining 6 buttons
    for (let i = 1; i < 7; i++) {
      await user.tab();
      expect(document.activeElement).toBe(buttons[i]);
    }
  });

  it('buttons are in logical DOM order: Add, Delete, Undo, Redo, Save, Load, Export', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    const labels = buttons.map(
      (btn) => (btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase()
    );
    // Verify the expected logical order
    expect(labels[0]).toMatch(/add/i);
    expect(labels[1]).toMatch(/delete/i);
    expect(labels[2]).toMatch(/undo/i);
    expect(labels[3]).toMatch(/redo/i);
    expect(labels[4]).toMatch(/save/i);
    expect(labels[5]).toMatch(/load/i);
    expect(labels[6]).toMatch(/export/i);
  });

  it('no button has tabIndex=-1 (all are in natural tab sequence)', () => {
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    buttons.forEach((btn) => {
      // tabIndex should be 0 or unset (default 0), never -1
      expect(btn.tabIndex).not.toBe(-1);
    });
  });
});

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-03: Enter key triggers button action
// ---------------------------------------------------------------------------
describe('Toolbar — T-A11Y-A11Y-001-03: Enter/Space key activates buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Enter key on Add Brick button calls onAddBrick', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[0].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onAddBrick).toHaveBeenCalledTimes(1);
  });

  it('Space key on Add Brick button calls onAddBrick', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[0].focus();
    await user.keyboard(' ');
    expect(mockProps.onAddBrick).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Delete Brick button calls onDeleteBrick', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[1].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onDeleteBrick).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Undo button calls onUndo', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[2].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onUndo).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Redo button calls onRedo', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[3].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onRedo).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Save button calls onSave', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[4].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Load button calls onLoad', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[5].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onLoad).toHaveBeenCalledTimes(1);
  });

  it('Enter key on Export button calls onExport', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...mockProps} />);
    const toolbar = screen.getByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');

    buttons[6].focus();
    await user.keyboard('{Enter}');
    expect(mockProps.onExport).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-04: Zero axe-core WCAG 2.1 AA violations
// ---------------------------------------------------------------------------
describe('Toolbar — T-A11Y-A11Y-001-04: axe-core WCAG 2.1 AA audit', () => {
  it('Toolbar has zero WCAG 2.1 AA violations', async () => {
    const { container } = render(<Toolbar {...mockProps} />);
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(results).toHaveNoViolations();
  });

  it('Toolbar has zero violations with all buttons in default state', async () => {
    const { container } = render(<Toolbar {...mockProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
