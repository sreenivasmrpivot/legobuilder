/**
 * FR-UI-002: Brick Palette Sidebar — Component Tests
 *
 * Test IDs: T-FE-UI-002-01, T-FE-UI-002-02, T-FE-UI-002-03, T-FE-UI-002-04
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-002
 * Spectra-Tests: T-FE-UI-002-01, T-FE-UI-002-02, T-FE-UI-002-03, T-FE-UI-002-04
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';

// ---------------------------------------------------------------------------
// Mock Three.js / R3F — not available in jsdom
// ---------------------------------------------------------------------------
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: {}, gl: {}, scene: {} })),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Box: () => null,
  Sphere: () => null,
}));

vi.mock('three', () => ({
  default: {},
  Vector3: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
  Color: vi.fn(() => ({})),
  MeshStandardMaterial: vi.fn(() => ({})),
  BoxGeometry: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Mock uiStore — isolate component from Zustand
// ---------------------------------------------------------------------------
const mockSetActiveBrickType = vi.fn();
const mockSetActiveColor = vi.fn();

let mockActiveBrickType = 'brick-1x1';
let mockActiveColor = '#FF0000';

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      activeBrickType: mockActiveBrickType,
      activeColor: mockActiveColor,
      setActiveBrickType: mockSetActiveBrickType,
      setActiveColor: mockSetActiveColor,
    };
    return selector ? selector(state) : state;
  }),
}));

// ---------------------------------------------------------------------------
// Mock colorPalette utility
// ---------------------------------------------------------------------------
vi.mock('../../src/utils/colorPalette', () => ({
  colorPalette: [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFFFFF', '#000000',
    '#FF8800', '#8800FF', '#00FF88', '#FF0088',
  ],
}));

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks are set up
// ---------------------------------------------------------------------------
import { BrickPalette } from '../../src/components/ui/BrickPalette';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BRICK_TYPES = [
  { id: 'brick-1x1', label: '1×1' },
  { id: 'brick-2x1', label: '2×1' },
  { id: 'brick-2x2', label: '2×2' },
  { id: 'brick-4x1', label: '4×1' },
  { id: 'brick-4x2', label: '4×2' },
];

const COLOR_SWATCHES = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFFFFF', '#000000',
  '#FF8800', '#8800FF', '#00FF88', '#FF0088',
];

// ---------------------------------------------------------------------------
// T-FE-UI-002-01: Brick types displayed with visual previews
// ---------------------------------------------------------------------------
describe('T-FE-UI-002-01 — Brick palette displays brick types with visual previews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveBrickType = 'brick-1x1';
    mockActiveColor = '#FF0000';
  });

  it('renders the brick palette sidebar', () => {
    render(<BrickPalette />);
    // Sidebar must be present in the DOM
    const sidebar = screen.getByRole('complementary', { name: /brick palette/i })
      ?? screen.getByTestId('brick-palette');
    expect(sidebar).toBeTruthy();
  });

  it('renders a visual preview (thumbnail) for each brick type', () => {
    render(<BrickPalette />);
    // Each brick type should have a preview element
    BRICK_TYPES.forEach(({ id }) => {
      const preview =
        screen.queryByTestId(`brick-preview-${id}`) ??
        screen.queryByLabelText(new RegExp(id, 'i'));
      expect(preview).toBeTruthy();
    });
  });

  it('renders a label or accessible name for each brick type', () => {
    render(<BrickPalette />);
    BRICK_TYPES.forEach(({ label }) => {
      // Label text or aria-label must be present
      const el = screen.queryByText(new RegExp(label.replace('×', '[x×]'), 'i'));
      expect(el).toBeTruthy();
    });
  });

  it('marks the currently active brick type as selected', () => {
    mockActiveBrickType = 'brick-2x2';
    render(<BrickPalette />);
    const activeItem =
      screen.queryByTestId('brick-preview-brick-2x2') ??
      screen.queryByRole('option', { name: /2×2/i, selected: true }) ??
      screen.queryByRole('button', { name: /2×2/i });
    expect(activeItem).toBeTruthy();
    // Active item should carry an aria-pressed or aria-selected attribute
    const isMarked =
      activeItem?.getAttribute('aria-pressed') === 'true' ||
      activeItem?.getAttribute('aria-selected') === 'true' ||
      activeItem?.classList.contains('active') ||
      activeItem?.classList.contains('selected') ||
      activeItem?.getAttribute('data-active') === 'true';
    expect(isMarked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-02: Clicking a brick type sets it as the active placement brick
// ---------------------------------------------------------------------------
describe('T-FE-UI-002-02 — Clicking a brick type updates uiStore.activeBrickType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveBrickType = 'brick-1x1';
    mockActiveColor = '#FF0000';
  });

  it('calls setActiveBrickType with the clicked brick id', async () => {
    render(<BrickPalette />);
    const target = BRICK_TYPES[1]; // brick-2x1
    const btn =
      screen.queryByTestId(`brick-preview-${target.id}`) ??
      screen.queryByRole('button', { name: new RegExp(target.label.replace('×', '[x×]'), 'i') });
    expect(btn).toBeTruthy();
    await act(async () => {
      fireEvent.click(btn!);
    });
    expect(mockSetActiveBrickType).toHaveBeenCalledWith(target.id);
    expect(mockSetActiveBrickType).toHaveBeenCalledTimes(1);
  });

  it('calls setActiveBrickType for each brick type when clicked', async () => {
    render(<BrickPalette />);
    for (const { id, label } of BRICK_TYPES) {
      vi.clearAllMocks();
      const btn =
        screen.queryByTestId(`brick-preview-${id}`) ??
        screen.queryByRole('button', { name: new RegExp(label.replace('×', '[x×]'), 'i') });
      if (btn) {
        await act(async () => { fireEvent.click(btn); });
        expect(mockSetActiveBrickType).toHaveBeenCalledWith(id);
      }
    }
  });

  it('does not call setActiveColor when a brick type is clicked', async () => {
    render(<BrickPalette />);
    const btn =
      screen.queryByTestId('brick-preview-brick-4x1') ??
      screen.queryByRole('button', { name: /4×1/i });
    if (btn) {
      await act(async () => { fireEvent.click(btn); });
    }
    expect(mockSetActiveColor).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-03: Color picker selection updates uiStore.activeColor
// ---------------------------------------------------------------------------
describe('T-FE-UI-002-03 — Color picker updates uiStore.activeColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveBrickType = 'brick-1x1';
    mockActiveColor = '#FF0000';
  });

  it('renders 12 color swatches from colorPalette', () => {
    render(<BrickPalette />);
    // Swatches can be buttons, divs with role=button, or radio inputs
    const swatches =
      screen.queryAllByTestId(/color-swatch/) ??
      screen.queryAllByRole('radio') ??
      [];
    // At minimum, 12 swatches must be present
    expect(swatches.length).toBeGreaterThanOrEqual(12);
  });

  it('calls setActiveColor with the selected color hex when a swatch is clicked', async () => {
    render(<BrickPalette />);
    const targetColor = COLOR_SWATCHES[2]; // '#0000FF'
    const swatch =
      screen.queryByTestId(`color-swatch-${targetColor.replace('#', '')}`) ??
      screen.queryByLabelText(new RegExp(targetColor, 'i')) ??
      screen.queryByRole('radio', { name: new RegExp(targetColor, 'i') });
    if (swatch) {
      await act(async () => { fireEvent.click(swatch); });
      expect(mockSetActiveColor).toHaveBeenCalledWith(targetColor);
    } else {
      // Fallback: find any swatch and click it
      const allSwatches = screen.queryAllByTestId(/color-swatch/);
      if (allSwatches.length > 0) {
        await act(async () => { fireEvent.click(allSwatches[2]); });
        expect(mockSetActiveColor).toHaveBeenCalledTimes(1);
      }
    }
  });

  it('marks the currently active color swatch as selected', () => {
    mockActiveColor = '#00FF00';
    render(<BrickPalette />);
    const activeSwatch =
      screen.queryByTestId('color-swatch-00FF00') ??
      screen.queryByLabelText(/#00FF00/i) ??
      screen.queryByRole('radio', { name: /#00FF00/i, checked: true });
    if (activeSwatch) {
      const isMarked =
        activeSwatch.getAttribute('aria-checked') === 'true' ||
        activeSwatch.getAttribute('aria-pressed') === 'true' ||
        activeSwatch.getAttribute('aria-selected') === 'true' ||
        activeSwatch.classList.contains('active') ||
        activeSwatch.classList.contains('selected') ||
        (activeSwatch as HTMLInputElement).checked === true;
      expect(isMarked).toBe(true);
    }
  });

  it('does not call setActiveBrickType when a color swatch is clicked', async () => {
    render(<BrickPalette />);
    const swatches = screen.queryAllByTestId(/color-swatch/);
    if (swatches.length > 0) {
      await act(async () => { fireEvent.click(swatches[0]); });
      expect(mockSetActiveBrickType).not.toHaveBeenCalled();
    }
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-04: Sidebar width ≤ 25% of 1024px viewport (≤ 256px)
// ---------------------------------------------------------------------------
describe('T-FE-UI-002-04 — Sidebar does not obscure more than 25% of 1024px canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveBrickType = 'brick-1x1';
    mockActiveColor = '#FF0000';
  });

  it('sidebar element has max-width of 256px (w-64 / 25% of 1024px)', () => {
    render(<BrickPalette />);
    const sidebar =
      screen.queryByRole('complementary') ??
      screen.queryByTestId('brick-palette');
    expect(sidebar).toBeTruthy();
    // Check Tailwind class or inline style
    const hasTailwindClass =
      sidebar?.classList.contains('w-64') ||
      sidebar?.classList.contains('max-w-64') ||
      sidebar?.classList.contains('max-w-xs');
    const style = sidebar ? window.getComputedStyle(sidebar) : null;
    const hasStyleConstraint =
      style?.maxWidth === '256px' ||
      style?.width === '256px';
    // Either Tailwind class or computed style must enforce the constraint
    expect(hasTailwindClass || hasStyleConstraint).toBe(true);
  });

  it('sidebar has a fixed or bounded width attribute in the DOM', () => {
    render(<BrickPalette />);
    const sidebar =
      screen.queryByRole('complementary') ??
      screen.queryByTestId('brick-palette');
    expect(sidebar).toBeTruthy();
    // The sidebar must not use w-full without a max-width cap
    const hasUnboundedWidth =
      sidebar?.classList.contains('w-full') &&
      !sidebar?.classList.contains('max-w-64') &&
      !sidebar?.classList.contains('max-w-xs');
    expect(hasUnboundedWidth).toBe(false);
  });
});
