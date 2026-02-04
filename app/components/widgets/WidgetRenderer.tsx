"use client";

import { useEffect, useState } from "react";
import type { Widget } from "@/lib/apiClient";
import { executeQuery, type ExecuteResult } from "@/lib/apiClient";
import { TableChart } from "@/app/components/charts/Table";
import { BarChart } from "@/app/components/charts/BarChart";
import { LineChart } from "@/app/components/charts/LineChart";

type Props = {
  widget: Widget;
  from?: string;
  to?: string;
};

export function WidgetRenderer({ widget, from, to }: Props) {
  const [data, setData] = useState<ExecuteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
      if (!token) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await executeQuery(token, widget.queryId, { from, to });
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [widget.queryId, from, to]);

  return (
    <div className="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-200">
      {isLoading && <p className="text-xs text-zinc-500 dark:text-zinc-400">読み込み中...</p>}
      {error && !isLoading && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {!isLoading && !error && data && data.rows.length === 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">データがありません。</p>
      )}

      {!isLoading && !error && data && data.rows.length > 0 && (
        <>
          {widget.type === "table" && (
            <TableChart columns={data.columns} rows={data.rows} />
          )}
          {widget.type === "bar" && (
            <BarChart
              xKey={(widget.config as { xKey?: string })?.xKey ?? data.columns[0]}
              yKey={
                (widget.config as { yKeys?: string[] })?.yKeys?.[0] ?? data.columns[1]
              }
              rows={data.rows}
            />
          )}
          {widget.type === "line" && (
            <LineChart
              xKey={(widget.config as { xKey?: string })?.xKey ?? data.columns[0]}
              yKey={
                (widget.config as { yKeys?: string[] })?.yKeys?.[0] ?? data.columns[1]
              }
              rows={data.rows}
            />
          )}
        </>
      )}
    </div>
  );
}
