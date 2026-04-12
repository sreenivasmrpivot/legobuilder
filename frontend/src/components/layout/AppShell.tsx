import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SceneCanvasStub } from '../canvas/SceneCanvas';

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          <SceneCanvasStub />
        </main>
      </div>
    </div>
  );
}
