export interface GridCell {
  col: number;
  row: number;
  count: number;
  intensity: number;
}

export function bucketClicks(clicks: { x: number; y: number }[], cellSize: number): GridCell[] {
  const counts = new Map<string, GridCell>();
  for (const { x, y } of clicks) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const key = `${col}:${row}`;
    const cell = counts.get(key) ?? { col, row, count: 0, intensity: 0 };
    cell.count += 1;
    counts.set(key, cell);
  }
  const cells = [...counts.values()];
  const max = Math.max(1, ...cells.map((cell) => cell.count));
  for (const cell of cells) cell.intensity = cell.count / max;
  return cells.sort((a, b) => a.row - b.row || a.col - b.col);
}

export const SEQUENTIAL_RAMP = [
  "#b7d3f6",
  "#86b6ef",
  "#5598e7",
  "#2a78d6",
  "#1c5cab",
  "#104281",
  "#0d366b",
] as const;

export function heatColor(intensity: number): string {
  const clamped = Math.min(1, Math.max(0, intensity));
  return SEQUENTIAL_RAMP[Math.min(SEQUENTIAL_RAMP.length - 1, Math.floor(clamped * SEQUENTIAL_RAMP.length))];
}
