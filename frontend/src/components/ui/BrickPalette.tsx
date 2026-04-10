import { BRICK_CATALOG, COLOR_PALETTE } from '@/engine/brickCatalog';

export function BrickPalette() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">Bricks</h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {Object.values(BRICK_CATALOG).map((brick) => (
          <button
            key={brick.type}
            className="p-2 text-xs text-center rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            data-testid={`brick-${brick.type}`}
          >
            {brick.name}
          </button>
        ))}
      </div>
      <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">Colors</h2>
      <div className="grid grid-cols-5 gap-2">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors"
            style={{ backgroundColor: color }}
            data-testid={`color-${color}`}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </aside>
  );
}
