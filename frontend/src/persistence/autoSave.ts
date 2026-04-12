import { useSceneStore } from '../stores/sceneStore';
import { sceneRepository } from './sceneRepository';
import { debounce } from '../utils/debounce';

const AUTOSAVE_DELAY_MS = 5000;

const debouncedSave = debounce(async () => {
  const state = useSceneStore.getState();
  if (state.isDirty && state.sceneId) {
    await sceneRepository.save({
      id: state.sceneId, name: state.sceneName, bricks: state.bricks,
      gridSize: state.gridSize, brickCount: state.brickCount,
      thumbnail: '', createdAt: '', updatedAt: '', schemaVersion: 1,
    });
    useSceneStore.getState().setDirty(false);
  }
}, AUTOSAVE_DELAY_MS);

export function initAutoSave(): () => void {
  return useSceneStore.subscribe(() => { debouncedSave(); });
}
