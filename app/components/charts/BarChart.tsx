"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart as ReBarChart,
} from "recharts";

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
  baseline?: "zero" | "dataMin";
};

type Props = {
  xKey: string;
  series: SeriesConfig[];
  rows: Record<string, unknown>[];
  options?: ChartOptions;
};

const DEFAULT_COLORS = [
  "#51a2ff", // blue-400
  "#ffb900", // amber-400
  "#05df72", // green-400
  "#ff6467", // red-400
  "#a684ff", // violet-400
  "#ff8904", // orange-400
];

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function computeMinMax(
  rows: Record<string, unknown>[],
  keys: string[],
  stacked: boolean,
): { min: number; max: number } | null {
  if (keys.length === 0) return null;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let saw = false;

  for (const row of rows) {
    if (!stacked) {
      for (const key of keys) {
        const v = toFiniteNumber((row as Record<string, unknown>)[key]);
        if (v === null) continue;
        saw = true;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      continue;
    }

    // stacked: positive/negative を分けて合計（Rechartsのsign-based stackingに近い形）
    let posSum = 0;
    let negSum = 0;
    let rowSaw = false;
    for (const key of keys) {
      const v = toFiniteNumber((row as Record<string, unknown>)[key]);
      if (v === null) continue;
      rowSaw = true;
      if (v >= 0) posSum += v;
      else negSum += v;
    }
    if (!rowSaw) continue;
    saw = true;
    if (negSum < min) min = negSum;
    if (posSum > max) max = posSum;
  }

  return saw ? { min, max } : null;
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value: unknown, mode: ChartOptions["numberFormat"]): string {
  const n = toNumber(value);
  if (mode === "none") return String(n);
  if (mode === "compact") {
    return new Intl.NumberFormat("ja-JP", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  }
  // comma (default)
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(n);
}

function formatDateLabel(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value ?? "");
}

export function BarChart({ xKey, series, rows, options }: Props) {
  const showLegend = options?.showLegend ?? true;
  const showGrid = options?.showGrid ?? true;
  const showTooltip = options?.showTooltip ?? true;
  const stacked = options?.stacked ?? false;
  const numberFormat = options?.numberFormat ?? "comma";
  const baseline = options?.baseline ?? "zero";

  const leftSeries = series.filter((s) => (s.axis ?? "left") === "left");
  const rightSeries = series.filter((s) => s.axis === "right");
  const hasRight = rightSeries.length > 0;

  const leftStats = computeMinMax(rows, leftSeries.map((s) => s.yKey), stacked);
  const rightStats = hasRight ? computeMinMax(rows, rightSeries.map((s) => s.yKey), stacked) : null;
  const canAlignZero =
    !!leftStats &&
    !!rightStats &&
    leftStats.min < 0 &&
    leftStats.max > 0 &&
    rightStats.min < 0 &&
    rightStats.max > 0;

  const useDataMinBaselineLeft = baseline === "dataMin" && !!leftStats && leftStats.min < 0;
  const useDataMinBaselineRight = baseline === "dataMin" && !!rightStats && rightStats.min < 0;

  const leftDomain: [number, number] | undefined = useDataMinBaselineLeft
    ? [leftStats.min, leftStats.max]
    : canAlignZero
      ? (() => {
          const maxAbs = Math.max(Math.abs(leftStats.min), Math.abs(leftStats.max));
          return [-maxAbs, maxAbs];
        })()
      : undefined;

  const rightDomain: [number, number] | undefined = useDataMinBaselineRight
    ? [rightStats.min, rightStats.max]
    : canAlignZero
      ? (() => {
          const maxAbs = Math.max(Math.abs(rightStats.min), Math.abs(rightStats.max));
          return [-maxAbs, maxAbs];
        })()
      : undefined;

  const useDataMinBaseline = useDataMinBaselineLeft || useDataMinBaselineRight;

  if (rows.length === 0) return null;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={rows}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          baseValue={useDataMinBaseline ? "dataMin" : undefined}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickFormatter={formatDateLabel} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatNumber(v, numberFormat)}
            domain={leftDomain}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, numberFormat)}
              domain={rightDomain}
            />
          )}

          {showTooltip && (
            <Tooltip
              formatter={(v, name) => [formatNumber(v, numberFormat), String(name)]}
              labelFormatter={(label) => formatDateLabel(label)}
              contentStyle={{
                backgroundColor: "rgba(226, 232, 240, 0.95)",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                padding: "8px 12px",
              }}
              labelStyle={{
                color: "#18181b",
                fontWeight: 600,
                marginBottom: "4px",
              }}
              itemStyle={{
                fontSize: "12px",
              }}
            />
          )}
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}

          {leftSeries.map((s, idx) => (
            <Bar
              key={`left-${s.yKey}`}
              yAxisId="left"
              dataKey={s.yKey}
              name={s.label ?? s.yKey}
              fill={s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={false}
            />
          ))}
          {rightSeries.map((s, idx) => (
            <Bar
              key={`right-${s.yKey}`}
              yAxisId="right"
              dataKey={s.yKey}
              name={s.label ?? s.yKey}
              fill={s.color ?? DEFAULT_COLORS[(leftSeries.length + idx) % DEFAULT_COLORS.length]}
              stackId={stacked ? "stackR" : undefined}
              isAnimationActive={false}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
