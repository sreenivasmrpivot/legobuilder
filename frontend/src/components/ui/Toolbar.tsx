/** Toolbar stub - FR-UI-001, FR-EDIT-001, FR-EDIT-002 */
export function ToolbarStub() {
  return (
    <div className="flex items-center gap-2" data-testid="toolbar">
      <button className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600" disabled>Undo</button>
      <button className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600" disabled>Redo</button>
      <div className="mx-2 h-6 w-px bg-gray-600" />
      <button className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600" disabled>New</button>
      <button className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600" disabled>Save</button>
      <button className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600" disabled>Export</button>
    </div>
  );
}
