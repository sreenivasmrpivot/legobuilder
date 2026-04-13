import { useCallback } from 'react';
import { useSelectionStore } from '../stores/selectionStore';

export function useSelection() {
  const setSelectedBrickId = useSelectionStore((s) => s.setSelectedBrickId);

  const handleBrickClick = useCallback(
    (brickId: string, event: { stopPropagation?: () => void }) => {
      event.stopPropagation?.();
      setSelectedBrickId(brickId);
    },
    [setSelectedBrickId],
  );

  return {
    handleBrickClick,
  };
}
