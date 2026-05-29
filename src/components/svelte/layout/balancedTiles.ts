type BalancedColumnsInput = {
  itemCount: number;
  containerWidth: number;
  targetTileWidth?: number;
  gap?: number;
};

type BalancedTileLayout = {
  columns: number;
  tracks: number;
  spans: number[];
};

export function chooseBalancedColumns({
  itemCount,
  containerWidth,
  targetTileWidth = 136,
  gap = 16,
}: BalancedColumnsInput): number {
  if (!Number.isFinite(itemCount) || itemCount <= 1) return Math.max(1, Math.floor(itemCount || 1));

  const usableWidth = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : Infinity;
  const target = Math.max(80, targetTileWidth);
  const spacing = Math.max(0, gap);
  const maxFit = Number.isFinite(usableWidth)
    ? Math.max(1, Math.min(itemCount, Math.floor((usableWidth + spacing) / (target + spacing))))
    : itemCount;

  if (maxFit >= itemCount) return itemCount;

  let bestColumns = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let columns = 1; columns <= maxFit; columns += 1) {
    const rows = Math.ceil(itemCount / columns);
    const lastRowCount = itemCount - columns * (rows - 1);
    const orphanPenalty = rows > 1 && lastRowCount === 1 ? 100 : 0;
    const balancePenalty = rows > 1 ? ((columns - lastRowCount) / columns) * 10 : 0;
    const rowPenalty = rows;
    const widthPenalty = (maxFit - columns) * 0.05;
    const score = orphanPenalty + balancePenalty + rowPenalty + widthPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestColumns = columns;
    }
  }

  return bestColumns;
}

export function createBalancedTileLayout(itemCount: number, columns: number): BalancedTileLayout {
  const count = Math.max(0, Math.floor(itemCount));
  const safeColumns = Math.max(1, Math.min(count || 1, Math.floor(columns)));
  const rows = Math.ceil(count / safeColumns);
  const lastRowCount = count - safeColumns * (rows - 1);
  const hasPartialLastRow = rows > 1 && lastRowCount > 0 && lastRowCount < safeColumns;
  const tracks = hasPartialLastRow ? lcm(safeColumns, lastRowCount) : safeColumns;
  const fullRowSpan = Math.max(1, tracks / safeColumns);
  const lastRowSpan = hasPartialLastRow ? Math.max(1, tracks / lastRowCount) : fullRowSpan;

  return {
    columns: safeColumns,
    tracks,
    spans: Array.from({ length: count }, (_, index) => {
      const isLastPartialRow = hasPartialLastRow && Math.floor(index / safeColumns) === rows - 1;
      return isLastPartialRow ? lastRowSpan : fullRowSpan;
    }),
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.floor(a));
  let y = Math.abs(Math.floor(b));
  while (y > 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.max(1, Math.abs(Math.floor((a * b) / gcd(a, b))));
}
