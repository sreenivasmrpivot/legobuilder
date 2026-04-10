export interface Command {
  execute(): void;
  undo(): void;
  readonly description: string;
}
