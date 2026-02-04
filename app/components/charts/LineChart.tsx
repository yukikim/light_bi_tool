type Props = {
  xKey: string;
  yKey: string;
  rows: Record<string, unknown>[];
};

// 簡易版: 折れ線グラフの代わりに、値の推移をスパークライン風に表現

export function LineChart({ xKey, yKey, rows }: Props) {
  const values = rows.map((r) => Number(r[yKey] ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-end gap-1 h-16">
        {values.map((v, idx) => {
          const ratio = Math.max(0, v) / max;
          return (
            <div
              key={idx}
              className="flex-1 rounded-t bg-zinc-900 dark:bg-zinc-100"
              style={{ height: `${ratio * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
        {rows.map((r, idx) => (
          <span key={idx} className="truncate">
            {String(r[xKey] ?? "")}
          </span>
        ))}
      </div>
    </div>
  );
}
