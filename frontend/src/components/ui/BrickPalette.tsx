import { useUiStore } from '../../stores/uiStore';

const BRICK_TYPES = ['1x1', '1x2', '2x2', '2x4'];
const BRICK_COLORS = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF8800',
  '#FFFFFF',
  '#000000',
  '#888888',
];

export function BrickPalette() {
  const activeBrickType = useUiStore((s) => s.activeBrickType);
  const activeColor = useUiStore((s) => s.activeColor);
  const setActiveBrickType = useUiStore((s) => s.setActiveBrickType);
  const setActiveColor = useUiStore((s) => s.setActiveColor);

  return (
    <div className="brick-palette" role="region" aria-label="Brick palette">
      <div className="brick-types">
        <h3>Brick Types</h3>
        {BRICK_TYPES.map((type) => (
          <button
            key={type}
            role="button"
            aria-label={`${type} brick`}
            aria-pressed={activeBrickType === type}
            className={`brick-type-btn ${activeBrickType === type ? 'active' : ''}`}
            onClick={() => setActiveBrickType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="brick-colors">
        <h3>Colors</h3>
        {BRICK_COLORS.map((color) => (
          <button
            key={color}
            role="button"
            aria-label={`${color} color`}
            aria-pressed={activeColor === color}
            className={`color-swatch ${activeColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setActiveColor(color)}
          />
        ))}
      </div>
    </div>
  );
}
