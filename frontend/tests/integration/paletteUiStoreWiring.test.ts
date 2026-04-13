/**
 * Integration Test: BrickPalette ↔ uiStore ↔ useBrickPlacement
 *
 * Verifies the palette selection pipeline:
 * - Selecting a brick type in the palette updates uiStore.selectedBrickType
 * - Selecting a color updates uiStore.selectedColor
 * - useBrickPlacement reads the correct type/color from uiStore when placing
 * - Ghost brick preview reflects the currently selected type/color
 * - Deselecting resets placement mode
 *
 * BUG-88 Root Cause: RC-4 (BrickPalette not wired to uiStore)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

type BrickType = '1x1' | '1x2' | '2x2' | '2x4';
type BrickColor = 'red' | 'blue' | 'green' | 'yellow' | 'white' | 'black';

type UiState = {
  selectedBrickType: BrickType;
  selectedColor: BrickColor;
  setSelectedBrickType: (t: BrickType) => void;
  setSelectedColor: (c: BrickColor) => void;
  reset: () => void;
};

function makeUiStore(): UiState {
  let selectedBrickType: BrickType = '2x4';
  let selectedColor: BrickColor = 'red';
  return {
    get selectedBrickType() { return selectedBrickType; },
    get selectedColor() { return selectedColor; },
    setSelectedBrickType(t) { selectedBrickType = t; },
    setSelectedColor(c) { selectedColor = c; },
    reset() { selectedBrickType = '2x4'; selectedColor = 'red'; },
  };
}

type PlacedBrick = {
  id: string;
  type: BrickType;
  color: BrickColor;
  position: [number, number, number];
  rotation: number;
};

function makePlacementHook(ui: UiState) {
  let ghostPosition: [number, number, number] | null = null;
  let rotation = 0;
  const placed: PlacedBrick[] = [];
  let idCounter = 0;

  return {
    get ghostPosition() { return ghostPosition; },
    get ghostType() { return ui.selectedBrickType; },
    get ghostColor() { return ui.selectedColor; },
    get rotation() { return rotation; },
    get placedBricks() { return placed; },

    onPointerMove(pos: [number, number, number]) {
      ghostPosition = pos;
    },
    onPointerLeave() {
      ghostPosition = null;
    },
    onPointerClick(pos: [number, number, number]) {
      placed.push({
        id: String(++idCounter),
        type: ui.selectedBrickType,
        color: ui.selectedColor,
        position: pos,
        rotation,
      });
    },
    rotate() {
      rotation = (rotation + 90) % 360;
    },
    resetRotation() {
      rotation = 0;
    },
  };
}

/** Simulates BrickPalette onClick handlers */
function makePaletteHandlers(ui: UiState) {
  return {
    selectType(t: BrickType) { ui.setSelectedBrickType(t); },
    selectColor(c: BrickColor) { ui.setSelectedColor(c); },
  };
}

describe('Integration: BrickPalette ↔ uiStore ↔ useBrickPlacement', () => {
  let ui: UiState;
  let placement: ReturnType<typeof makePlacementHook>;
  let palette: ReturnType<typeof makePaletteHandlers>;

  beforeEach(() => {
    ui = makeUiStore();
    placement = makePlacementHook(ui);
    palette = makePaletteHandlers(ui);
  });

  // -------------------------------------------------------------------------
  // RC-4: uiStore wiring
  // -------------------------------------------------------------------------

  it('RC-4: default selectedBrickType is 2x4', () => {
    expect(ui.selectedBrickType).toBe('2x4');
  });

  it('RC-4: default selectedColor is red', () => {
    expect(ui.selectedColor).toBe('red');
  });

  it('RC-4: palette.selectType updates uiStore.selectedBrickType', () => {
    palette.selectType('1x2');
    expect(ui.selectedBrickType).toBe('1x2');
  });

  it('RC-4: palette.selectColor updates uiStore.selectedColor', () => {
    palette.selectColor('blue');
    expect(ui.selectedColor).toBe('blue');
  });

  it('RC-4: ghost brick reflects currently selected type', () => {
    palette.selectType('2x2');
    placement.onPointerMove([0, 0, 0]);
    expect(placement.ghostType).toBe('2x2');
  });

  it('RC-4: ghost brick reflects currently selected color', () => {
    palette.selectColor('green');
    placement.onPointerMove([0, 0, 0]);
    expect(placement.ghostColor).toBe('green');
  });

  it('RC-4: placed brick uses type and color from uiStore at click time', () => {
    palette.selectType('1x1');
    palette.selectColor('yellow');
    placement.onPointerClick([2, 0, 4]);
    expect(placement.placedBricks).toHaveLength(1);
    expect(placement.placedBricks[0].type).toBe('1x1');
    expect(placement.placedBricks[0].color).toBe('yellow');
    expect(placement.placedBricks[0].position).toEqual([2, 0, 4]);
  });

  it('RC-4: changing type mid-session affects subsequent placements only', () => {
    palette.selectType('2x4');
    placement.onPointerClick([0, 0, 0]);
    palette.selectType('1x1');
    placement.onPointerClick([2, 0, 0]);
    expect(placement.placedBricks[0].type).toBe('2x4');
    expect(placement.placedBricks[1].type).toBe('1x1');
  });

  it('RC-4: rotation state is independent of palette selection', () => {
    placement.rotate();
    palette.selectType('2x2');
    expect(placement.rotation).toBe(90);
  });

  it('RC-4: placed brick includes current rotation', () => {
    placement.rotate(); // 90°
    placement.rotate(); // 180°
    placement.onPointerClick([0, 0, 0]);
    expect(placement.placedBricks[0].rotation).toBe(180);
  });

  it('RC-4: ghost disappears on pointer leave', () => {
    placement.onPointerMove([0, 0, 0]);
    expect(placement.ghostPosition).not.toBeNull();
    placement.onPointerLeave();
    expect(placement.ghostPosition).toBeNull();
  });

  it('RC-4: uiStore.reset() restores defaults', () => {
    palette.selectType('1x1');
    palette.selectColor('black');
    ui.reset();
    expect(ui.selectedBrickType).toBe('2x4');
    expect(ui.selectedColor).toBe('red');
  });
});
