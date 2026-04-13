import React from 'react';
import { Viewport } from './viewport/Viewport';
import { Toolbar } from './ui/Toolbar';
import { BrickPalette } from './ui/BrickPalette';
import { StatusBar } from './ui/StatusBar';
import { ResumePrompt } from './ui/ResumePrompt';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../hooks/useAutoSave';

export function App() {
  useKeyboardShortcuts();
  useAutoSave();

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className="sidebar" style={{ width: '240px', flexShrink: 0 }}>
          <BrickPalette />
        </aside>
        <main className="main-content" style={{ flex: 1, position: 'relative' }} data-testid="viewport-container">
          <Viewport />
        </main>
      </div>
      <StatusBar />
      <ResumePrompt />
    </div>
  );
}
