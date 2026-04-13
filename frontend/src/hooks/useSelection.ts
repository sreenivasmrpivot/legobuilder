import { useCallback } from 'react';
import { useSelectionStore } from '../stores/selectionStore';
import { useSceneStore } from '../stores/sceneStore';
import { selectionManager } from '../engine/selectionManager';
import type { ThreeEvent } from '@react-three/fiber';

export function useSelection() {
  const setSelectedBrick = useSelectionStore((s) => s.setSelectedBrick);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const bricks = useSceneStore((s) => s.bricks);

  const handleBrickClick = useCallback(
    (brickId: string, event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      selectionManager.selectBrick(brickId);
    },
    []
  );

  return {
    handleBrickClick,
  };
}
