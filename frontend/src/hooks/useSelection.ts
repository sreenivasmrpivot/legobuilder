export function useSelection() {
  return { selectBrick: (_id: string) => {}, clearSelection: () => {}, selectedIds: [] as string[] };
}
