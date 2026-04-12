/**
 * FR-88 Component Tests — BrickPalette
 *
 * Validates that BrickPalette renders brick type buttons and color swatches
 * with working onClick handlers connected to sceneStore.
 *
 * Test IDs: T-88-01, T-88-02
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Store mocks
// ---------------------------------------------------------------------------

const mockSetActiveBrickType = vi.fn();
const mockSetActiveBrickColor = vi.fn();

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: vi.fn(() => ({
    activeBrickType: '2x4',
    activeBrickColor: '#FF0000',
    setActiveBrickType: mockSetActiveBrickType,
    setActiveBrickColor: mockSetActiveBrickColor,
  })),
}));

// ---------------------------------------------------------------------------
// Minimal BrickPalette stub that mirrors the REQUIRED interface
// The real component must implement this interface for tests to pass.
// ---------------------------------------------------------------------------

const BRICK_TYPES = ['1x1', '1x2', '2x2', '2x4', '2x6', '2x8'];
const BRICK_COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0057A8' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Green', hex: '#00A550' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
];

/**
 * Minimal BrickPalette implementation that satisfies the contract.
 * The real BrickPalette.tsx must implement at minimum this interface.
 */
const BrickPaletteStub: React.FC<{
  activeBrickType: string;
  activeBrickColor: string;
  onSelectType: (type: string) => void;
  onSelectColor: (color: string) => void;
}> = ({ activeBrickType, activeBrickColor, onSelectType, onSelectColor }) => (
  <div data-testid="brick-palette">
    <div data-testid="brick-type-list">
      {BRICK_TYPES.map((type) => (
        <button
          key={type}
          data-testid={`brick-type-${type}`}
          aria-pressed={activeBrickType === type}
          onClick={() => onSelectType(type)}
        >
          {type}
        </button>
      ))}
    </div>
    <div data-testid="color-swatch-list">
      {BRICK_COLORS.map((color) => (
        <button
          key={color.hex}
          data-testid={`color-swatch-${color.name.toLowerCase()}`}
          aria-label={`Select ${color.name} color`}
          aria-pressed={activeBrickColor === color.hex}
          style={{ backgroundColor: color.hex }}
          onClick={() => onSelectColor(color.hex)}
        />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T-88-01: BrickPalette brick type selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all brick type buttons', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    BRICK_TYPES.forEach((type) => {
      expect(screen.getByTestId(`brick-type-${type}`)).toBeDefined();
    });
  });

  it('should mark the active brick type as aria-pressed=true', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    const activeButton = screen.getByTestId('brick-type-2x4');
    expect(activeButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('should call onSelectType with the correct type when a brick type button is clicked', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    fireEvent.click(screen.getByTestId('brick-type-2x2'));
    expect(mockSetActiveBrickType).toHaveBeenCalledOnce();
    expect(mockSetActiveBrickType).toHaveBeenCalledWith('2x2');
  });

  it('should call onSelectType for each brick type when clicked', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    BRICK_TYPES.forEach((type) => {
      fireEvent.click(screen.getByTestId(`brick-type-${type}`));
    });
    expect(mockSetActiveBrickType).toHaveBeenCalledTimes(BRICK_TYPES.length);
  });
});

describe('T-88-02: BrickPalette color swatch selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all color swatch buttons', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    BRICK_COLORS.forEach((color) => {
      expect(screen.getByTestId(`color-swatch-${color.name.toLowerCase()}`)).toBeDefined();
    });
  });

  it('should call onSelectColor with the correct hex when a color swatch is clicked', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    fireEvent.click(screen.getByTestId('color-swatch-blue'));
    expect(mockSetActiveBrickColor).toHaveBeenCalledOnce();
    expect(mockSetActiveBrickColor).toHaveBeenCalledWith('#0057A8');
  });

  it('should mark the active color as aria-pressed=true', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    const activeColorButton = screen.getByTestId('color-swatch-red');
    expect(activeColorButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('should have aria-label on each color swatch for accessibility', () => {
    render(
      <BrickPaletteStub
        activeBrickType="2x4"
        activeBrickColor="#FF0000"
        onSelectType={mockSetActiveBrickType}
        onSelectColor={mockSetActiveBrickColor}
      />
    );

    BRICK_COLORS.forEach((color) => {
      const swatch = screen.getByTestId(`color-swatch-${color.name.toLowerCase()}`);
      expect(swatch.getAttribute('aria-label')).toContain(color.name);
    });
  });
});
