/**
 * T-A11Y-A11Y-001-02 & T-A11Y-A11Y-001-03 & T-A11Y-A11Y-001-04
 * NFR-A11Y-001: Keyboard Navigation for BrickPalette
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding adds
 * roving tabIndex and ARIA listbox attributes to
 * src/components/ui/BrickPalette.tsx
 *
 * Test coverage:
 * - T-A11Y-A11Y-001-02: Arrow key navigation through brick types
 * - T-A11Y-A11Y-001-03: Enter/Space key selects focused brick type
 * - T-A11Y-A11Y-001-04: Zero axe-core WCAG 2.1 AA violations (jest-axe)
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-A11Y-001
 * Spectra-Tests: T-A11Y-A11Y-001-02, T-A11Y-A11Y-001-03, T-A11Y-A11Y-001-04
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
// BrickPalette must be updated by frontend-coding to include:
// - role="listbox" on the container
// - aria-label="Brick Types" on the container
// - aria-orientation="vertical" on the container
// - role="option" on each brick item
// - aria-selected={isSelected} on each brick item
// - tabIndex={isActive ? 0 : -1} on each brick item (roving tabIndex)
// - onKeyDown handler for ArrowDown/ArrowUp/Home/End/Enter/Space
// ---------------------------------------------------------------------------
import BrickPalette from '../../src/components/ui/BrickPalette';

// ---------------------------------------------------------------------------
// Mock brick types data
// ---------------------------------------------------------------------------
const MOCK_BRICK_TYPES = [
  { id: '1x1', label: '1×1 Brick', color: '#ff0000', dimensions: { width: 1, height: 1, depth: 1 } },
  { id: '2x2', label: '2×2 Brick', color: '#00ff00', dimensions: { width: 2, height: 1, depth: 2 } },
  { id: '2x4', label: '2×4 Brick', color: '#0000ff', dimensions: { width: 4, height: 1, depth: 2 } },
  { id: '1x2', label: '1×2 Brick', color: '#ffff00', dimensions: { width: 2, height: 1, depth: 1 } },
  { id: '2x6', label: '2×6 Brick', color: '#ff00ff', dimensions: { width: 6, height: 1, depth: 2 } },
];

const mockOnSelectBrickType = vi.fn();

const defaultProps = {
  brickTypes: MOCK_BRICK_TYPES,
  selectedBrickType: '1x1',
  onSelectBrickType: mockOnSelectBrickType,
};

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-02: Arrow key navigation through BrickPalette
// ---------------------------------------------------------------------------
describe('BrickPalette — T-A11Y-A11Y-001-02: Arrow key navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a listbox container with role="listbox"', () => {
    render(<BrickPalette {...defaultProps} />);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeDefined();
  });

  it('listbox has aria-label="Brick Types"', () => {
    render(<BrickPalette {...defaultProps} />);
    const listbox = screen.getByRole('listbox', { name: /brick types/i });
    expect(listbox).toBeDefined();
  });

  it('listbox has aria-orientation="vertical"', () => {
    render(<BrickPalette {...defaultProps} />);
    const listbox = screen.getByRole('listbox');
    expect(listbox.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('renders all brick types as role="option" elements', () => {
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(MOCK_BRICK_TYPES.length);
  });

  it('only one option has tabIndex=0 at a time (roving tabIndex)', () => {
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const zeroTabIndexCount = options.filter((opt) => opt.tabIndex === 0).length;
    expect(zeroTabIndexCount).toBe(1);
  });

  it('all non-active options have tabIndex=-1', () => {
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const negativeTabIndexCount = options.filter((opt) => opt.tabIndex === -1).length;
    expect(negativeTabIndexCount).toBe(MOCK_BRICK_TYPES.length - 1);
  });

  it('first option has tabIndex=0 on initial render', () => {
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options[0].tabIndex).toBe(0);
  });

  it('ArrowDown moves focus to next option', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    // Focus first option
    options[0].focus();
    expect(document.activeElement).toBe(options[0]);

    // Press ArrowDown
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options[1]);
  });

  it('ArrowUp moves focus to previous option', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    // Focus second option
    options[1].focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(options[0]);
  });

  it('ArrowDown wraps from last option to first', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const lastIndex = MOCK_BRICK_TYPES.length - 1;

    // Focus last option
    options[lastIndex].focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options[0]);
  });

  it('ArrowUp wraps from first option to last', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const lastIndex = MOCK_BRICK_TYPES.length - 1;

    // Focus first option
    options[0].focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(options[lastIndex]);
  });

  it('Home key moves focus to first option', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    // Focus last option
    options[options.length - 1].focus();
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(options[0]);
  });

  it('End key moves focus to last option', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    // Focus first option
    options[0].focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(options[options.length - 1]);
  });

  it('Tab key exits the palette (does not cycle within)', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BrickPalette {...defaultProps} />
        <button data-testid="next-focusable">Next</button>
      </div>
    );
    const options = screen.getAllByRole('option');
    const nextButton = screen.getByTestId('next-focusable');

    options[0].focus();
    await user.tab();
    // Focus should move OUT of the palette to the next focusable element
    expect(document.activeElement).toBe(nextButton);
  });
});

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-03: Enter/Space key selects focused brick type
// ---------------------------------------------------------------------------
describe('BrickPalette — T-A11Y-A11Y-001-03: Enter/Space key selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Enter key on focused option calls onSelectBrickType with correct id', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    options[0].focus();
    await user.keyboard('{Enter}');
    expect(mockOnSelectBrickType).toHaveBeenCalledWith('1x1');
  });

  it('Space key on focused option calls onSelectBrickType with correct id', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    options[0].focus();
    await user.keyboard(' ');
    expect(mockOnSelectBrickType).toHaveBeenCalledWith('1x1');
  });

  it('Enter key on second option calls onSelectBrickType with second brick id', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    options[1].focus();
    await user.keyboard('{Enter}');
    expect(mockOnSelectBrickType).toHaveBeenCalledWith('2x2');
  });

  it('ArrowDown then Enter selects the second option', async () => {
    const user = userEvent.setup();
    render(<BrickPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');

    options[0].focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(mockOnSelectBrickType).toHaveBeenCalledWith('2x2');
  });

  it('selected option has aria-selected="true"', () => {
    render(<BrickPalette {...defaultProps} selectedBrickType="2x4" />);
    const options = screen.getAllByRole('option');
    const selectedOption = options.find(
      (opt) => opt.getAttribute('aria-selected') === 'true'
    );
    expect(selectedOption).toBeDefined();
    // The selected option should correspond to '2x4'
    const label = selectedOption?.getAttribute('aria-label') || selectedOption?.textContent || '';
    expect(label).toMatch(/2.?4/i);
  });

  it('non-selected options have aria-selected="false"', () => {
    render(<BrickPalette {...defaultProps} selectedBrickType="1x1" />);
    const options = screen.getAllByRole('option');
    const nonSelectedOptions = options.filter(
      (opt) => opt.getAttribute('aria-selected') !== 'true'
    );
    expect(nonSelectedOptions).toHaveLength(MOCK_BRICK_TYPES.length - 1);
    nonSelectedOptions.forEach((opt) => {
      expect(opt.getAttribute('aria-selected')).toBe('false');
    });
  });
});

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-04: Zero axe-core WCAG 2.1 AA violations
// ---------------------------------------------------------------------------
describe('BrickPalette — T-A11Y-A11Y-001-04: axe-core WCAG 2.1 AA audit', () => {
  it('BrickPalette has zero WCAG 2.1 AA violations', async () => {
    const { container } = render(<BrickPalette {...defaultProps} />);
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(results).toHaveNoViolations();
  });

  it('BrickPalette has zero violations with a selected brick type', async () => {
    const { container } = render(
      <BrickPalette {...defaultProps} selectedBrickType="2x4" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('BrickPalette has zero violations with all brick types rendered', async () => {
    const { container } = render(<BrickPalette {...defaultProps} />);
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(results).toHaveNoViolations();
  });
});
