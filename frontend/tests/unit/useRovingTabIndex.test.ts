/**
 * T-A11Y-A11Y-001-02 — useRovingTabIndex hook unit tests
 * NFR-A11Y-001: Keyboard Navigation for Toolbar & BrickPalette
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/hooks/useRovingTabIndex.ts
 *
 * Tests the roving tabIndex hook that manages keyboard focus within
 * the BrickPalette listbox (ARIA APG Listbox pattern).
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-A11Y-001
 * Spectra-Tests: T-A11Y-A11Y-001-02
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module under test (does NOT exist yet — created by frontend-coding)
// ---------------------------------------------------------------------------
import { useRovingTabIndex } from '../../src/hooks/useRovingTabIndex';

// ---------------------------------------------------------------------------
// T-A11Y-A11Y-001-02: Arrow key navigation through BrickPalette
// ---------------------------------------------------------------------------
describe('useRovingTabIndex — T-A11Y-A11Y-001-02: arrow key navigation', () => {
  describe('initial state', () => {
    it('starts with activeIndex=0', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      expect(result.current.activeIndex).toBe(0);
    });

    it('respects custom initialIndex option', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5, initialIndex: 2 })
      );
      expect(result.current.activeIndex).toBe(2);
    });

    it('returns getItemProps function', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3 })
      );
      expect(typeof result.current.getItemProps).toBe('function');
    });

    it('returns setActiveIndex function', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3 })
      );
      expect(typeof result.current.setActiveIndex).toBe('function');
    });
  });

  describe('getItemProps — tabIndex management', () => {
    it('active item (index 0) has tabIndex=0', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      const props = result.current.getItemProps(0);
      expect(props.tabIndex).toBe(0);
    });

    it('non-active items have tabIndex=-1', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      expect(result.current.getItemProps(1).tabIndex).toBe(-1);
      expect(result.current.getItemProps(2).tabIndex).toBe(-1);
      expect(result.current.getItemProps(3).tabIndex).toBe(-1);
      expect(result.current.getItemProps(4).tabIndex).toBe(-1);
    });

    it('only one item has tabIndex=0 at a time', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      act(() => {
        result.current.setActiveIndex(3);
      });
      const tabIndexes = [0, 1, 2, 3, 4].map(
        (i) => result.current.getItemProps(i).tabIndex
      );
      const zeroCount = tabIndexes.filter((t) => t === 0).length;
      expect(zeroCount).toBe(1);
      expect(result.current.getItemProps(3).tabIndex).toBe(0);
    });

    it('getItemProps returns data-active=true for active item', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3 })
      );
      expect(result.current.getItemProps(0)['data-active']).toBe(true);
      expect(result.current.getItemProps(1)['data-active']).toBe(false);
    });

    it('getItemProps returns onKeyDown handler', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3 })
      );
      const props = result.current.getItemProps(0);
      expect(typeof props.onKeyDown).toBe('function');
    });
  });

  describe('setActiveIndex — direct navigation', () => {
    it('setActiveIndex updates activeIndex', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      act(() => {
        result.current.setActiveIndex(4);
      });
      expect(result.current.activeIndex).toBe(4);
    });

    it('setActiveIndex clamps to valid range (0 to itemCount-1)', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      act(() => {
        result.current.setActiveIndex(10); // out of range
      });
      // Should clamp to last valid index
      expect(result.current.activeIndex).toBeLessThanOrEqual(4);
    });
  });

  describe('ArrowDown key — move to next item', () => {
    it('ArrowDown moves activeIndex from 0 to 1', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(1);
    });

    it('ArrowDown wraps from last item to first (wrap=true)', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, wrap: true })
      );
      act(() => {
        result.current.setActiveIndex(2); // last item
      });
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      act(() => {
        result.current.getItemProps(2).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(0); // wraps to first
    });

    it('ArrowDown clamps at last item when wrap=false', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, wrap: false })
      );
      act(() => {
        result.current.setActiveIndex(2); // last item
      });
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      act(() => {
        result.current.getItemProps(2).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(2); // stays at last
    });
  });

  describe('ArrowUp key — move to previous item', () => {
    it('ArrowUp moves activeIndex from 2 to 1', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      act(() => {
        result.current.setActiveIndex(2);
      });
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      act(() => {
        result.current.getItemProps(2).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(1);
    });

    it('ArrowUp wraps from first item to last (wrap=true)', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, wrap: true })
      );
      // activeIndex is 0 by default
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(2); // wraps to last
    });

    it('ArrowUp clamps at first item when wrap=false', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 3, wrap: false })
      );
      // activeIndex is 0 by default
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(0); // stays at first
    });
  });

  describe('Home / End keys', () => {
    it('Home key moves activeIndex to 0', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      act(() => {
        result.current.setActiveIndex(4);
      });
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      act(() => {
        result.current.getItemProps(4).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(0);
    });

    it('End key moves activeIndex to last item', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      const event = new KeyboardEvent('keydown', { key: 'End' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('handles itemCount=1 without errors', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 1 })
      );
      expect(result.current.activeIndex).toBe(0);
      expect(result.current.getItemProps(0).tabIndex).toBe(0);
    });

    it('ArrowDown on single item stays at 0 (wrap=true)', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 1, wrap: true })
      );
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(0);
    });

    it('unhandled keys do not change activeIndex', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({ itemCount: 5 })
      );
      const event = new KeyboardEvent('keydown', { key: 'a' });
      act(() => {
        result.current.getItemProps(0).onKeyDown(event as unknown as React.KeyboardEvent);
      });
      expect(result.current.activeIndex).toBe(0); // unchanged
    });
  });
});
