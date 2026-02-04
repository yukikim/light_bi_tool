"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesConfig = {
  yKey: string;
  label?: string;
  color?: string;
  axis?: "left" | "right";
};

type ChartOptions = {
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
  "#0f172a", // slate-900
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#7c3aed", // violet-600
  "#ea580c", // orange-600
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
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(n);
}

export function LineChart({ xKey, series, rows, options }: Props) {
  const showLegend = options?.showLegend ?? true;
  const showGrid = options?.showGrid ?? true;
  const showTooltip = options?.showTooltip ?? true;
  const numberFormat = options?.numberFormat ?? "comma";

  const leftSeries = series.filter((s) => (s.axis ?? "left") === "left");
  const rightSeries = series.filter((s) => s.axis === "right");
  const hasRight = rightSeries.length > 0;

  if (rows.length === 0) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
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
              labelFormatter={(label) => String(label)}
            />
          )}
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}

          {leftSeries.map((s, idx) => (
            <Line
              key={`left-${s.yKey}`}
              yAxisId="left"
              type="monotone"
              dataKey={s.yKey}
              name={s.label ?? s.yKey}
              stroke={s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {rightSeries.map((s, idx) => (
            <Line
              key={`right-${s.yKey}`}
              yAxisId="right"
              type="monotone"
              dataKey={s.yKey}
              name={s.label ?? s.yKey}
              stroke={
                s.color ?? DEFAULT_COLORS[(leftSeries.length + idx) % DEFAULT_COLORS.length]
              }
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
