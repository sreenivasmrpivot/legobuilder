/**
 * Root application component.
 *
 * Mounts the main layout with toolbar, brick palette, 3D viewport
 * (wrapped in SceneErrorBoundary), and status bar.
 *
 * FR: FR-SCENE-001
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import { Toolbar } from './ui/Toolbar';
import { BrickPalette } from './ui/BrickPalette';
import { StatusBar } from './ui/StatusBar';
import { SceneErrorBoundary } from './viewport/SceneErrorBoundary';
import { ViewportCanvas } from './viewport/ViewportCanvas';

export function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <BrickPalette />
        <main className="flex-1 relative" data-testid="viewport-container">
          <SceneErrorBoundary>
            <ViewportCanvas />
          </SceneErrorBoundary>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
