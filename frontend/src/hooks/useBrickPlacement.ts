import { useState, useCallback } from 'react';
import { useSceneStore } from '../stores/sceneStore';
import { useHistoryStore } from '../stores/historyStore';
import { useUiStore } from '../stores/uiStore';
import { placementEngine } from '../engine/placementEngine';
import type { ThreeEvent } from '@react-three/fiber';

export interface GhostBrick {
  position: [number, number, number];
  type: string;
  color: string;
  rotation: number;
  isValid: boolean;
}

export function useBrickPlacement() {
  const addBrick = useSceneStore((s) => s.addBrick);
  const occupancyMap = useSceneStore((s) => s.occupancyMap);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const activeBrickType = useUiStore((s) => s.activeBrickType);
  const activeColor = useUiStore((s) => s.activeColor);
  const activeTool = useUiStore((s) => s.activeTool);
  const rotation = useUiStore((s) => s.rotation);

  const [ghostBrick, setGhostBrick] = useState<GhostBrick | null>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Only place bricks when the active tool is 'place'
      if (activeTool !== 'place') return;

      const snapped = placementEngine.snapToGrid(e.point);
      if (!snapped) return;

      const isValid = placementEngine.validatePlacement(
        snapped,
        activeBrickType,
        rotation,
        occupancyMap
      );
      if (!isValid) return;

      pushSnapshot();

      const id = crypto.randomUUID();
      addBrick({
        id,
        type: activeBrickType,
        color: activeColor,
        position: snapped as [number, number, number],
        rotation,
      });
    },
    [addBrick, occupancyMap, pushSnapshot, activeBrickType, activeColor, activeTool, rotation]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const snapped = placementEngine.snapToGrid(e.point);
      if (!snapped) {
        setGhostBrick(null);
        return;
      }

      const isValid = placementEngine.validatePlacement(
        snapped,
        activeBrickType,
        rotation,
        occupancyMap
      );

      setGhostBrick({
        position: snapped as [number, number, number],
        type: activeBrickType,
        color: activeColor,
        rotation,
        isValid,
      });
    },
    [activeBrickType, activeColor, rotation, occupancyMap]
  );

  const handlePointerUp = useCallback((_e: ThreeEvent<PointerEvent>) => {
    // Reserved for drag-and-drop completion
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    ghostBrick,
  };
}
