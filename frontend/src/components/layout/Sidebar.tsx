import { BrickPaletteStub } from '../ui/BrickPalette';
import { PropertyPanelStub } from '../ui/PropertyPanel';

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-gray-700 bg-gray-800">
      <BrickPaletteStub />
      <PropertyPanelStub />
    </aside>
  );
}
