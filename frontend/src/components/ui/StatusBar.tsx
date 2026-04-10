export function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-4 py-1 bg-white border-t border-gray-200 text-xs text-gray-500">
      <span data-testid="brick-count">Bricks: 0 / 500</span>
      <span data-testid="auto-save-status">Auto-save: idle</span>
      <span data-testid="fps-counter">FPS: --</span>
    </footer>
  );
}
