export function Toolbar() {
  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      <h1 className="text-lg font-bold text-gray-800 mr-4">LegoBuilder</h1>
      <div className="flex gap-1">
        <button className="px-3 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50" data-testid="undo-btn">Undo</button>
        <button className="px-3 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50" data-testid="redo-btn">Redo</button>
      </div>
      <div className="flex-1" />
      <div className="flex gap-1">
        <button className="px-3 py-1 text-sm rounded hover:bg-gray-100" data-testid="save-btn">Save</button>
        <button className="px-3 py-1 text-sm rounded hover:bg-gray-100" data-testid="export-btn">Export</button>
      </div>
    </header>
  );
}
