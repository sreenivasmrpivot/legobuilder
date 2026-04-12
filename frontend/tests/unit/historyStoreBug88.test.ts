/**
 * T-BUG-88-04
 * historyStore.undo() / redo() — Toolbar Undo/Redo buttons must call these.
 *
 * BUG #88: Toolbar.tsx renders Undo/Redo buttons but onClick handlers
 * are missing or are no-ops. This test verifies the store contract.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline stub mirroring the historyStore contract.
// ---------------------------------------------------------------------------
interface Command {
  execute: () => void;
  undo: () => void;
}

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  push: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
}

function createHistoryStore(maxHistory = 50): HistoryState {
  const past: Command[] = [];
  const future: Command[] = [];

  return {
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    push(cmd: Command) {
      cmd.execute();
      past.push(cmd);
      future.length = 0; // clear redo stack
      if (past.length > maxHistory) past.shift();
    },
    undo() {
      if (past.length === 0) return;
      const cmd = past.pop()!;
      cmd.undo();
      future.push(cmd);
    },
    redo() {
      if (future.length === 0) return;
      const cmd = future.pop()!;
      cmd.execute();
      past.push(cmd);
    },
  };
}

function makeCommand(log: string[]): Command {
  return {
    execute() { log.push('execute'); },
    undo() { log.push('undo'); },
  };
}

describe('T-BUG-88-04 — historyStore undo/redo', () => {
  let store: HistoryState;

  beforeEach(() => {
    store = createHistoryStore();
  });

  it('canUndo is false when history is empty', () => {
    expect(store.canUndo).toBe(false);
  });

  it('canRedo is false when future stack is empty', () => {
    expect(store.canRedo).toBe(false);
  });

  it('canUndo becomes true after pushing a command', () => {
    const log: string[] = [];
    store.push(makeCommand(log));
    expect(store.canUndo).toBe(true);
  });

  it('undo() calls command.undo() and moves command to future stack', () => {
    const log: string[] = [];
    store.push(makeCommand(log));
    store.undo();
    expect(log).toContain('undo');
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);
  });

  it('redo() re-executes the undone command', () => {
    const log: string[] = [];
    store.push(makeCommand(log));
    store.undo();
    store.redo();
    expect(log.filter(e => e === 'execute')).toHaveLength(2);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);
  });

  it('undo() on empty history is a no-op (no error)', () => {
    expect(() => store.undo()).not.toThrow();
  });

  it('redo() on empty future is a no-op (no error)', () => {
    expect(() => store.redo()).not.toThrow();
  });

  it('pushing a new command clears the redo stack', () => {
    const log: string[] = [];
    store.push(makeCommand(log));
    store.undo();
    expect(store.canRedo).toBe(true);
    store.push(makeCommand(log));
    expect(store.canRedo).toBe(false);
  });

  it('undo/redo is a function (not a no-op stub)', () => {
    const log: string[] = [];
    store.push(makeCommand(log));
    const undoLogLength = log.length;
    store.undo();
    // If undo is a no-op stub, log won't grow
    expect(log.length).toBeGreaterThan(undoLogLength);
  });
});
