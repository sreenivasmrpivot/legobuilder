import { ToolbarStub } from '../ui/Toolbar';

export function Header() {
  return (
    <header className="flex h-12 items-center border-b border-gray-700 bg-gray-800 px-4">
      <h1 className="mr-6 text-lg font-bold text-lego-yellow">LegoBuilder</h1>
      <ToolbarStub />
    </header>
  );
}
