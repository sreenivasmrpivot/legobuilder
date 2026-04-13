import React from 'react';
import { Viewport } from './viewport/Viewport';
import { Toolbar } from './ui/Toolbar';
import { BrickPalette } from './ui/BrickPalette';
import { ResumePrompt } from './ui/ResumePrompt';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../hooks/useAutoSave';

export function App() {
  useKeyboardShortcuts();
  useAutoSave();

  return (
    <div className="app" style={{ display: 'flex', height: '100vh' }}>
      <aside className="sidebar" style={{ width: '240px', flexShrink: 0 }}>
        <BrickPalette />
      </aside>
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <div style={{ flex: 1, position: 'relative' }}>
          <Viewport />
        </div>
      </main>
      <ResumePrompt />
    </div>
  );
}
