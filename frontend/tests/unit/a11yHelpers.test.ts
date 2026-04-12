/**
 * NFR-A11Y-001: a11y utility helpers unit tests
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/utils/a11y.ts
 *
 * Tests the shared a11y utility module that provides:
 * - Key constants for keyboard navigation
 * - Helper functions for ARIA attribute generation
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-A11Y-001
 * Spectra-Tests: T-A11Y-A11Y-001-01, T-A11Y-A11Y-001-02
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Module under test (does NOT exist yet — created by frontend-coding)
// ---------------------------------------------------------------------------
import {
  KEYBOARD_KEYS,
  isNavigationKey,
  getListboxItemProps,
} from '../../src/utils/a11y';

// ---------------------------------------------------------------------------
// KEYBOARD_KEYS constants
// ---------------------------------------------------------------------------
describe('a11y utils — KEYBOARD_KEYS constants', () => {
  it('exports ARROW_DOWN constant', () => {
    expect(KEYBOARD_KEYS.ARROW_DOWN).toBe('ArrowDown');
  });

  it('exports ARROW_UP constant', () => {
    expect(KEYBOARD_KEYS.ARROW_UP).toBe('ArrowUp');
  });

  it('exports ARROW_LEFT constant', () => {
    expect(KEYBOARD_KEYS.ARROW_LEFT).toBe('ArrowLeft');
  });

  it('exports ARROW_RIGHT constant', () => {
    expect(KEYBOARD_KEYS.ARROW_RIGHT).toBe('ArrowRight');
  });

  it('exports HOME constant', () => {
    expect(KEYBOARD_KEYS.HOME).toBe('Home');
  });

  it('exports END constant', () => {
    expect(KEYBOARD_KEYS.END).toBe('End');
  });

  it('exports ENTER constant', () => {
    expect(KEYBOARD_KEYS.ENTER).toBe('Enter');
  });

  it('exports SPACE constant', () => {
    expect(KEYBOARD_KEYS.SPACE).toBe(' ');
  });

  it('exports ESCAPE constant', () => {
    expect(KEYBOARD_KEYS.ESCAPE).toBe('Escape');
  });

  it('exports TAB constant', () => {
    expect(KEYBOARD_KEYS.TAB).toBe('Tab');
  });
});

// ---------------------------------------------------------------------------
// isNavigationKey helper
// ---------------------------------------------------------------------------
describe('a11y utils — isNavigationKey()', () => {
  it('returns true for ArrowDown', () => {
    expect(isNavigationKey('ArrowDown')).toBe(true);
  });

  it('returns true for ArrowUp', () => {
    expect(isNavigationKey('ArrowUp')).toBe(true);
  });

  it('returns true for ArrowLeft', () => {
    expect(isNavigationKey('ArrowLeft')).toBe(true);
  });

  it('returns true for ArrowRight', () => {
    expect(isNavigationKey('ArrowRight')).toBe(true);
  });

  it('returns true for Home', () => {
    expect(isNavigationKey('Home')).toBe(true);
  });

  it('returns true for End', () => {
    expect(isNavigationKey('End')).toBe(true);
  });

  it('returns false for Enter', () => {
    expect(isNavigationKey('Enter')).toBe(false);
  });

  it('returns false for Space', () => {
    expect(isNavigationKey(' ')).toBe(false);
  });

  it('returns false for Tab', () => {
    expect(isNavigationKey('Tab')).toBe(false);
  });

  it('returns false for arbitrary letter keys', () => {
    expect(isNavigationKey('a')).toBe(false);
    expect(isNavigationKey('z')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getListboxItemProps helper
// ---------------------------------------------------------------------------
describe('a11y utils — getListboxItemProps()', () => {
  it('returns role="option" for all items', () => {
    const props = getListboxItemProps({ index: 0, activeIndex: 0, isSelected: false });
    expect(props.role).toBe('option');
  });

  it('returns tabIndex=0 for active item', () => {
    const props = getListboxItemProps({ index: 2, activeIndex: 2, isSelected: false });
    expect(props.tabIndex).toBe(0);
  });

  it('returns tabIndex=-1 for non-active item', () => {
    const props = getListboxItemProps({ index: 1, activeIndex: 0, isSelected: false });
    expect(props.tabIndex).toBe(-1);
  });

  it('returns aria-selected=true when isSelected=true', () => {
    const props = getListboxItemProps({ index: 0, activeIndex: 0, isSelected: true });
    expect(props['aria-selected']).toBe(true);
  });

  it('returns aria-selected=false when isSelected=false', () => {
    const props = getListboxItemProps({ index: 0, activeIndex: 0, isSelected: false });
    expect(props['aria-selected']).toBe(false);
  });

  it('returns data-active=true for active item', () => {
    const props = getListboxItemProps({ index: 3, activeIndex: 3, isSelected: false });
    expect(props['data-active']).toBe(true);
  });

  it('returns data-active=false for non-active item', () => {
    const props = getListboxItemProps({ index: 1, activeIndex: 0, isSelected: false });
    expect(props['data-active']).toBe(false);
  });
});
