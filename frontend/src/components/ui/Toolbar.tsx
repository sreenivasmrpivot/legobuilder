import { useUndoRedo } from '../../hooks/useUndoRedo';
import { useSceneStore } from '../../stores/sceneStore';
import { useSelectionStore } from '../../stores/selectionStore';

export function Toolbar() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const clearScene = useSceneStore((s) => s.clearScene);
  const removeBrick = useSceneStore((s) => s.removeBrick);
  const selectedBrickId = useSelectionStore((s) => s.selectedBrickId);

  return (
    <div className="toolbar" role="toolbar" aria-label="Scene toolbar">
      <button
        aria-label="Undo"
        onClick={() => undo()}
        disabled={!canUndo}
      >
        Undo
      </button>
      <button
        aria-label="Redo"
        onClick={() => redo()}
        disabled={!canRedo}
      >
        Redo
      </button>
      <button
        aria-label="New"
        onClick={() => clearScene()}
      >
        New
      </button>
      {selectedBrickId && (
        <button
          aria-label="Delete"
          onClick={() => removeBrick(selectedBrickId)}
        >
          Delete
        </button>
      )}
    </div>
  );
}
