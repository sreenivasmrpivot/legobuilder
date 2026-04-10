import type { Command } from '@/types/commands';
import type { Brick } from '@/types/brick';
import type { SceneState } from '@/stores/sceneStore';
import { OccupancyMap } from './occupancyMap';

export class PlaceBrickCommand implements Command {
  readonly description: string;

  constructor(
    private brick: Brick,
    private sceneStore: SceneState,
    private occupancyMap: OccupancyMap
  ) {
    this.description = `Place ${brick.type} at ${brick.position}`;
  }

  execute(): void {
    this.sceneStore.addBrick(this.brick);
    this.occupancyMap.occupy(this.brick);
  }

  undo(): void {
    this.sceneStore.removeBrick(this.brick.id);
    this.occupancyMap.release(this.brick);
  }
}

export class RemoveBrickCommand implements Command {
  readonly description: string;

  constructor(
    private brick: Brick,
    private sceneStore: SceneState,
    private occupancyMap: OccupancyMap
  ) {
    this.description = `Remove ${brick.type} from ${brick.position}`;
  }

  execute(): void {
    this.sceneStore.removeBrick(this.brick.id);
    this.occupancyMap.release(this.brick);
  }

  undo(): void {
    this.sceneStore.addBrick(this.brick);
    this.occupancyMap.occupy(this.brick);
  }
}
