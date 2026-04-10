import { create } from 'zustand';
import type { Command } from '@/types/commands';

const MAX_HISTORY = 50;

export interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  executeCommand: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  executeCommand: (cmd) => {
    cmd.execute();
    set((state) => {
      const newUndo = [...state.undoStack, cmd].slice(-MAX_HISTORY);
      return {
        undoStack: newUndo,
        redoStack: [],
        canUndo: newUndo.length > 0,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const cmd = undoStack[undoStack.length - 1]!;
    cmd.undo();
    set((state) => {
      const newUndo = state.undoStack.slice(0, -1);
      const newRedo = [...state.redoStack, cmd];
      return {
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: newUndo.length > 0,
        canRedo: newRedo.length > 0,
      };
    });
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;
    const cmd = redoStack[redoStack.length - 1]!;
    cmd.execute();
    set((state) => {
      const newRedo = state.redoStack.slice(0, -1);
      const newUndo = [...state.undoStack, cmd].slice(-MAX_HISTORY);
      return {
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: newUndo.length > 0,
        canRedo: newRedo.length > 0,
      };
    });
  },

  clear: () =>
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false }),
}));
