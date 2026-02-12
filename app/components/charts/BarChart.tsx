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

  const leftSeries = series.filter((s) => (s.axis ?? "left") === "left");
  const rightSeries = series.filter((s) => s.axis === "right");
  const hasRight = rightSeries.length > 0;

  if (rows.length === 0) return null;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickFormatter={formatDateLabel} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatNumber(v, numberFormat)}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatNumber(v, numberFormat)}
            />
          )}

          {showTooltip && (
            <Tooltip
              formatter={(v, name) => [formatNumber(v, numberFormat), String(name)]}
              labelFormatter={(label) => formatDateLabel(label)}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
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
