import { useCallback } from 'react';
import { selectionManager } from '../engine/selectionManager';
import type { ThreeEvent } from '@react-three/fiber';

export function useSelection() {
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
