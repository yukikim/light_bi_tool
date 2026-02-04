"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchDashboard, fetchWidgets, type Dashboard, type Widget } from "@/lib/apiClient";
import { WidgetContainer } from "@/app/components/widgets/WidgetContainer";
import { WidgetHeader } from "@/app/components/widgets/WidgetHeader";
import { WidgetRenderer } from "@/app/components/widgets/WidgetRenderer";

export default function DashboardDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [d, ws] = await Promise.all([
          fetchDashboard(token, params.id),
          fetchWidgets(token, params.id),
        ]);
        setDashboard(d);
        setWidgets(ws);
        setIsAuthorized(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ダッシュボードの読み込みに失敗しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router, params.id]);

  const handleApplyFilter = () => {
    // 今はまだ実際の再フェッチまでは行わず、後でExecute API実装時に連動させる
    console.log("apply filter", { from, to });
  };

  if (!isAuthorized && isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {dashboard?.name ?? `ダッシュボード (ID: ${params.id})`}
            </h1>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col text-xs text-zinc-600 dark:text-zinc-300">
              <span className="mb-1">期間（from/to）</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
                <span className="self-center text-zinc-500">〜</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyFilter}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              フィルタ適用
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">読み込み中...</p>
        )}
        {error && !isLoading && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {widgets.map((w) => (
              <WidgetContainer key={w.id}>
                <WidgetHeader title={w.name ?? `Widget ${w.id}`} />
                <WidgetRenderer widget={w} from={from} to={to} />
              </WidgetContainer>
            ))}

            {widgets.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                このダッシュボードにはまだウィジェットがありません。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
