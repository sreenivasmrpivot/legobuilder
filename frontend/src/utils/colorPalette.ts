/**
 * Utility: colorPalette
 *
 * Official LEGO-inspired color palette for the brick builder.
 * Colors chosen for contrast and accessibility (WCAG 2.1 AA).
 */

export const COLOR_PALETTE = [
  '#D01012', // Red
  '#0057A8', // Blue
  '#00852B', // Green
  '#FFD700', // Yellow
  '#FFFFFF', // White
  '#1B1B1B', // Black
  '#FF7E14', // Orange
  '#6B5A5A', // Dark Gray
  '#A0A0A0', // Light Gray
  '#8B4513', // Brown
] as const;

export type BrickColor = (typeof COLOR_PALETTE)[number];

export const DEFAULT_COLOR: BrickColor = '#D01012';

/**
 * Get a human-readable name for a color hex value.
 */
export function getColorName(hex: string): string {
  const names: Record<string, string> = {
    '#D01012': 'Red',
    '#0057A8': 'Blue',
    '#00852B': 'Green',
    '#FFD700': 'Yellow',
    '#FFFFFF': 'White',
    '#1B1B1B': 'Black',
    '#FF7E14': 'Orange',
    '#6B5A5A': 'Dark Gray',
    '#A0A0A0': 'Light Gray',
    '#8B4513': 'Brown',
  };
  return names[hex] ?? 'Unknown';
}
