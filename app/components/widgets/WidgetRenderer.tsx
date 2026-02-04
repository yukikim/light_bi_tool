"use client";

import { useEffect, useState } from "react";
import type { Widget } from "@/lib/apiClient";
import { executeQuery, type ExecuteResult } from "@/lib/apiClient";
import { TableChart } from "@/app/components/charts/Table";
import { BarChart } from "@/app/components/charts/BarChart";
import { LineChart } from "@/app/components/charts/LineChart";

type SeriesConfig = {
  yKey: string;
  label?: string;
  color?: string;
  axis?: "left" | "right";
};

type ChartOptions = {
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  numberFormat?: "compact" | "comma" | "none";
};

type ChartConfig = {
  xKey?: string;
  yKey?: string;
  yKeys?: string[];
  series?: SeriesConfig[];
  options?: ChartOptions;
};

function asChartConfig(config: Widget["config"]): ChartConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  return config as ChartConfig;
}

function buildSeries(cfg: ChartConfig, columns: string[]): SeriesConfig[] {
  const fromSeries = Array.isArray(cfg.series)
    ? cfg.series
        .filter((s): s is SeriesConfig => !!s && typeof s === "object" && typeof (s as SeriesConfig).yKey === "string")
        .map((s) => ({
          yKey: s.yKey,
          label: typeof s.label === "string" ? s.label : undefined,
          color: typeof s.color === "string" ? s.color : undefined,
          axis: s.axis === "right" ? "right" : "left",
        }))
    : [];

  const fromYKeys = Array.isArray(cfg.yKeys)
    ? cfg.yKeys.filter((k): k is string => typeof k === "string" && k.length > 0).map((k) => ({ yKey: k }))
    : [];

  const fromYKey = typeof cfg.yKey === "string" && cfg.yKey.length > 0 ? [{ yKey: cfg.yKey }] : [];

  const series = (fromSeries.length > 0 ? fromSeries : fromYKeys.length > 0 ? fromYKeys : fromYKey)
    .filter((s) => columns.includes(s.yKey));

  if (series.length > 0) return series;

  const fallback = columns[1];
  return fallback ? [{ yKey: fallback }] : [];
}

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
            (() => {
              const cfg = asChartConfig(widget.config);
              const xKey = cfg.xKey ?? data.columns[0];
              const series = buildSeries(cfg, data.columns);
              const options = cfg.options;
              if (!xKey || series.length === 0) {
                return (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    config が不足しています（xKey / series）
                  </p>
                );
              }
              return (
                <BarChart xKey={xKey} series={series} rows={data.rows} options={options} />
              );
            })()
          )}
          {widget.type === "line" && (
            (() => {
              const cfg = asChartConfig(widget.config);
              const xKey = cfg.xKey ?? data.columns[0];
              const series = buildSeries(cfg, data.columns);
              const options = cfg.options;
              if (!xKey || series.length === 0) {
                return (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    config が不足しています（xKey / series）
                  </p>
                );
              }
              return (
                <LineChart xKey={xKey} series={series} rows={data.rows} options={options} />
              );
            })()
          )}
        </>
      )}
    </div>
  );
}
