type Props = {
  columns: string[];
  rows: Record<string, unknown>[];
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value);
}

export function TableChart({ columns, rows }: Props) {
  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full divide-y divide-zinc-200 text-xs dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1 text-left font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1 text-zinc-700 dark:text-zinc-200">
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
