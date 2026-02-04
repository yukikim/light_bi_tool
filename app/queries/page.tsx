"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchQueries, createQueryApi, type Query } from "@/lib/apiClient";

export default function QueryListPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
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
        const list = await fetchQueries(token);
        setQueries(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : "クエリ一覧の取得に失敗しました";
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

    const name = window.prompt("クエリ名を入力してください", "新しいクエリ");
    if (!name) return;

    try {
      const created = await createQueryApi(token, name, "SELECT 1");
      router.push(`/queries/${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クエリの作成に失敗しました";
      alert(message);
    }
  };

  const handleRowClick = (id: Query["id"]) => {
    router.push(`/queries/${id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">クエリ一覧</h1>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            新規クエリ作成
          </button>
        </header>

        {isLoading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">読み込み中...</p>
        )}

        {error && !isLoading && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && queries.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            クエリがまだありません。「新規クエリ作成」から追加してください。
          </p>
        )}

        {!isLoading && !error && queries.length > 0 && (
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    名前
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {queries.map((q) => (
                  <tr
                    key={q.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => handleRowClick(q.id)}
                  >
                    <td className="px-4 py-2 text-sm text-zinc-900 dark:text-zinc-50">{q.name}</td>
                    <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">{q.id}</td>
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
