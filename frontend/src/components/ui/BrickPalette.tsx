import { BRICK_CATALOG, COLOR_PALETTE } from '../../engine/brickCatalog';

/** BrickPalette stub - FR-BRICK-001, FR-BRICK-002 */
export function BrickPaletteStub() {
  return (
    <div className="border-b border-gray-700 p-4" data-testid="brick-palette">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Bricks</h2>
      <div className="grid grid-cols-3 gap-2">
        {Object.values(BRICK_CATALOG).map((brick) => (
          <button key={brick.type} className="rounded bg-gray-700 p-2 text-xs hover:bg-gray-600" data-testid={`brick-${brick.type}`}>{brick.label}</button>
        ))}
      </div>
      <h2 className="mb-3 mt-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Colors</h2>
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map((color) => (
          <button key={color} className="h-6 w-6 rounded border border-gray-600" style={{ backgroundColor: color }} aria-label={`color ${color}`} data-testid={`color-${color}`} />
        ))}
      </div>
    </div>
  );
}
