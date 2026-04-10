import { Toolbar } from './ui/Toolbar';
import { BrickPalette } from './ui/BrickPalette';
import { StatusBar } from './ui/StatusBar';
import { Viewport } from './viewport/Viewport';

export function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <BrickPalette />
        <main className="flex-1 relative" data-testid="viewport-container">
          <Viewport />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
