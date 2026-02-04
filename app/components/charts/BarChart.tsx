type Props = {
  xKey: string;
  yKey: string;
  rows: Record<string, unknown>[];
};

export function BarChart({ xKey, yKey, rows }: Props) {
  const max = Math.max(...rows.map((r) => Number(r[yKey] ?? 0)), 1);

  return (
    <div className="space-y-1">
      {rows.map((row, idx) => {
        const label = String(row[xKey] ?? "-");
        const value = Number(row[yKey] ?? 0);
        const ratio = Math.max(0, value) / max;

        return (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="w-16 truncate text-zinc-600 dark:text-zinc-300">{label}</span>
            <div className="flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-3 rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-zinc-700 dark:text-zinc-200">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
