import type { Command } from '../types/command';
import type { Brick } from '../types/brick';

export class PlaceBrickCommand implements Command {
  constructor(private _brick: Brick) {}
  execute(): void { /* stub */ }
  undo(): void { /* stub */ }
  get description(): string { return `Place ${this._brick.type} at ${this._brick.position}`; }
}

export class DeleteBrickCommand implements Command {
  constructor(private _brick: Brick) {}
  execute(): void { /* stub */ }
  undo(): void { /* stub */ }
  get description(): string { return `Delete ${this._brick.type}`; }
}

export class MoveBrickCommand implements Command {
  constructor(private _brickId: string, private _from: [number, number, number], private _to: [number, number, number]) {}
  execute(): void { /* stub */ }
  undo(): void { /* stub */ }
  get description(): string { return `Move brick from ${this._from} to ${this._to}`; }
}

export class RotateBrickCommand implements Command {
  constructor(private _brickId: string, private _fromRotation: number, private _toRotation: number) {}
  execute(): void { /* stub */ }
  undo(): void { /* stub */ }
  get description(): string { return `Rotate brick to ${this._toRotation}`; }
}

export class ChangeBrickColorCommand implements Command {
  constructor(private _brickId: string, private _fromColor: string, private _toColor: string) {}
  execute(): void { /* stub */ }
  undo(): void { /* stub */ }
  get description(): string { return `Change color to ${this._toColor}`; }
}
