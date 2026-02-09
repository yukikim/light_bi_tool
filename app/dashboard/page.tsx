"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard, fetchDashboards, createDashboard, deleteDashboard } from "@/lib/apiClient";

export default function DashboardListPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<Dashboard["id"] | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const list = await fetchDashboards(token);
        setDashboards(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ダッシュボード一覧の取得に失敗しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router]);

  const handleCreate = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const name = window.prompt("ダッシュボード名を入力してください", "新しいダッシュボード");
    if (!name) return;

    try {
      const dashboard = await createDashboard(token, name);
      router.push(`/dashboard/${dashboard.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ダッシュボードの作成に失敗しました";
      alert(message);
    }
  };

  const handleRowClick = (id: Dashboard["id"]) => {
    router.push(`/dashboard/${id}`);
  };

  const handleDelete = async (id: Dashboard["id"], name: string) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const ok = window.confirm(`ダッシュボード「${name}」を削除しますか？`);
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteDashboard(token, id);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "ダッシュボードの削除に失敗しました";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ダッシュボード一覧
          </h1>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            新規ダッシュボード作成
          </button>
        </header>

        {isLoading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">読み込み中...</p>
        )}

        {error && !isLoading && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && dashboards.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ダッシュボードがまだありません。「新規ダッシュボード作成」から追加してください。
          </p>
        )}

        {!isLoading && dashboards.length > 0 && (
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    名前
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    作成日
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {dashboards.map((d) => (
                  <tr
                    key={d.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => handleRowClick(d.id)}
                  >
                    <td className="px-4 py-2 text-sm text-zinc-900 dark:text-zinc-50">{d.name}</td>
                    <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {d.createdAt ? new Date(d.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        className="rounded-md px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
                        disabled={deletingId === d.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(d.id, d.name);
                        }}
                      >
                        {deletingId === d.id ? "削除中..." : "削除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
