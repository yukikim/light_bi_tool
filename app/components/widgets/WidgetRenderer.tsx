"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QueryParamDef, Widget } from "@/lib/apiClient";
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
  queryParamDefs?: QueryParamDef[];
  globalParams?: Record<string, string | number | boolean | undefined>;
};

function coerceValue(def: QueryParamDef, raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  if (def.type === "number") {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  if (def.type === "boolean") {
    return trimmed === "true";
  }
  return trimmed;
}

export function WidgetRenderer({ widget, queryParamDefs, globalParams }: Props) {
  const [data, setData] = useState<ExecuteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const defs = useMemo(() => (Array.isArray(queryParamDefs) ? queryParamDefs : []), [queryParamDefs]);
  // 入力中(draft)と実行に使う確定値(committed)を分離し、onBlurでのみ再実行する
  const [draftParamValues, setDraftParamValues] = useState<Record<string, string>>({});
  const [committedParamValues, setCommittedParamValues] = useState<Record<string, string>>({});
  const lastGlobalRef = useRef<Record<string, string | number | boolean | undefined> | null>(null);

  useEffect(() => {
    // 初期値: default or globalParams を注入（既存入力は尊重）
    const prevGlobal = lastGlobalRef.current;
    setDraftParamValues((current) => {
      const next = { ...current };
      for (const d of defs) {
        if (!d?.name) continue;
        if (next[d.name] !== undefined && next[d.name].length > 0) continue;

        const gp = globalParams?.[d.name];
        if (gp !== undefined && gp !== null && String(gp).length > 0) {
          next[d.name] = String(gp);
          continue;
        }
        if (d.default !== undefined) {
          next[d.name] = String(d.default);
          continue;
        }
        if (next[d.name] === undefined) next[d.name] = "";
      }
      return next;
    });

    // まだ確定値が無いもの／または globalParams が変わったものは確定値も更新する
    setCommittedParamValues((current) => {
      const next = { ...current };
      for (const d of defs) {
        if (!d?.name) continue;
        const name = d.name;

        const gp = globalParams?.[name];
        const gpStr = gp !== undefined && gp !== null ? String(gp) : "";
        const prevGp = prevGlobal?.[name];
        const prevGpStr = prevGp !== undefined && prevGp !== null ? String(prevGp) : "";
        const globalChanged = gpStr.length > 0 && gpStr !== prevGpStr;

        if (next[name] !== undefined && next[name].length > 0 && !globalChanged) continue;

        if (gpStr.length > 0) {
          next[name] = gpStr;
          continue;
        }
        if (d.default !== undefined) {
          next[name] = String(d.default);
          continue;
        }
        if (next[name] === undefined) next[name] = "";
      }
      return next;
    });
  }, [defs, globalParams]);

  useEffect(() => {
    lastGlobalRef.current = globalParams ?? null;
  }, [globalParams]);

  const execParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const d of defs) {
      const raw = committedParamValues[d.name] ?? "";
      const value = coerceValue(d, raw);
      if (value === undefined) continue;
      params[d.name] = value;
    }
    return params;
  }, [defs, committedParamValues]);

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
      if (!token) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await executeQuery(token, widget.queryId, execParams);
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [widget.queryId, execParams]);

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
          {defs.length > 0 && (
            <div className="mb-3 grid grid-cols-1 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-2">
              {defs.map((p) => {
                const label = p.label?.trim().length ? p.label : p.name;
                const value = draftParamValues[p.name] ?? "";
                if (p.type === "boolean") {
                  return (
                    <label key={p.name} className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
                      <select
                        value={value || "false"}
                        onChange={(e) => setDraftParamValues((cur) => ({ ...cur, [p.name]: e.target.value }))}
                        onBlur={(e) => {
                          const committed = e.currentTarget.value;
                          setCommittedParamValues((cur) => ({ ...cur, [p.name]: committed }));
                        }}
                        className="w-full max-w-48 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    </label>
                  );
                }

                const inputType = p.type === "number" ? "number" : p.type === "date" ? "date" : "text";
                return (
                  <label key={p.name} className="flex items-center justify-between gap-2">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {label}{p.required ? " *" : ""}
                    </span>
                    <input
                      type={inputType}
                      value={value}
                      onChange={(e) => setDraftParamValues((cur) => ({ ...cur, [p.name]: e.target.value }))}
                      onBlur={(e) => {
                        const committed = e.currentTarget.value;
                        setCommittedParamValues((cur) => ({ ...cur, [p.name]: committed }));
                      }}
                      className="w-full max-w-48 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </label>
                );
              })}
            </div>
          )}

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
