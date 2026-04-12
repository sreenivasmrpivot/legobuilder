import { create } from 'zustand';
import type { Command } from '../types/command';

export interface CommandState {
  history: Command[];
  pointer: number;
  maxHistory: number;
}

export interface CommandActions {
  execute: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useCommandStore = create<CommandState & CommandActions>()((set, get) => ({
  history: [],
  pointer: -1,
  maxHistory: 50,
  execute: (command) => {
    command.execute();
    set((state) => {
      const newHistory = state.history.slice(0, state.pointer + 1);
      newHistory.push(command);
      if (newHistory.length > state.maxHistory) newHistory.shift();
      return { history: newHistory, pointer: newHistory.length - 1 };
    });
  },
  undo: () => { const { history, pointer } = get(); if (pointer >= 0) { history[pointer].undo(); set({ pointer: pointer - 1 }); } },
  redo: () => { const { history, pointer } = get(); if (pointer < history.length - 1) { history[pointer + 1].execute(); set({ pointer: pointer + 1 }); } },
  canUndo: () => get().pointer >= 0,
  canRedo: () => get().pointer < get().history.length - 1,
  clear: () => set({ history: [], pointer: -1 }),
}));
