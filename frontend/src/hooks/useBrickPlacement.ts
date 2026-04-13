import { useState, useCallback } from 'react';
import { useSceneStore } from '../stores/sceneStore';
import { useUiStore } from '../stores/uiStore';
import type { BrickType } from '../types/brick';

export interface GhostBrick {
  position: [number, number, number];
  type: string;
  color: string;
  rotation: number;
  isValid: boolean;
}

function snapToGrid(point: { x: number; y: number; z: number }): [number, number, number] {
  return [
    Math.round(point.x),
    Math.max(0, Math.round(point.y)),
    Math.round(point.z),
  ];
}

export function useBrickPlacement() {
  const addBrick = useSceneStore((s) => s.addBrick);
  const activeBrickType = useUiStore((s) => s.activeBrickType);
  const activeColor = useUiStore((s) => s.activeColor);
  const activeTool = useUiStore((s) => s.activeTool);
  const rotation = useUiStore((s) => s.rotation);

  const [ghostBrick, setGhostBrick] = useState<GhostBrick | null>(null);

  const handlePointerDown = useCallback(
    (e: unknown) => {
      if (activeTool !== 'place') return;
      const ev = e as { point?: { x: number; y: number; z: number } };
      if (!ev.point) return;
      const snapped = snapToGrid(ev.point);
      const id = crypto.randomUUID();
      addBrick({
        id,
        type: activeBrickType as BrickType,
        color: activeColor,
        position: snapped,
        rotation,
      });
    },
    [addBrick, activeBrickType, activeColor, activeTool, rotation],
  );

  const handlePointerMove = useCallback(
    (e: unknown) => {
      const ev = e as { point?: { x: number; y: number; z: number } };
      if (!ev.point) {
        setGhostBrick(null);
        return;
      }
      const snapped = snapToGrid(ev.point);
      setGhostBrick({
        position: snapped,
        type: activeBrickType,
        color: activeColor,
        rotation,
        isValid: true,
      });
    },
    [activeBrickType, activeColor, rotation],
  );

  const handlePointerUp = useCallback((_e: unknown) => {}, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    ghostBrick,
  };
}
