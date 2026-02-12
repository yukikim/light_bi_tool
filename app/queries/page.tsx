"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchQueries, createQueryApi, deleteQueryApi, type Query } from "@/lib/apiClient";

export default function QueryListPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; message: string } | null>(null);

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

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, query: Query) => {
    event.stopPropagation();
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const queryId = String(query.id);
    setError(null);
    if (deleteConfirm?.id !== queryId) {
      setDeleteConfirm(null);
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(queryId);
      return next;
    });

    try {
      await deleteQueryApi(token, query.id);
      setQueries((current) => current.filter((q) => String(q.id) !== queryId));
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クエリの削除に失敗しました";
      const status = (err as any)?.status as number | undefined;
      if (status === 409) {
        setDeleteConfirm({ id: queryId, message });
      } else {
        setError(message);
      }
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(queryId);
        return next;
      });
    }
  };

  const handleForceDelete = async (event: MouseEvent<HTMLButtonElement>, query: Query) => {
    event.stopPropagation();

    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const queryId = String(query.id);
    setError(null);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(queryId);
      return next;
    });

    try {
      await deleteQueryApi(token, query.id, { force: true });
      setQueries((current) => current.filter((q) => String(q.id) !== queryId));
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クエリの削除に失敗しました";
      setError(message);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(queryId);
        return next;
      });
    }
  };

  const handleCancelDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDeleteConfirm(null);
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
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    操作
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
                    <td className="px-4 py-2 text-sm">
                      {deleteConfirm?.id === String(q.id) ? (
                        <div className="space-y-2">
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">{deleteConfirm.message}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => handleForceDelete(event, q)}
                              disabled={deletingIds.has(String(q.id))}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-400"
                            >
                              delete
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelDelete}
                              disabled={deletingIds.has(String(q.id))}
                              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                              cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => handleDelete(event, q)}
                          disabled={deletingIds.has(String(q.id))}
                          className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          削除
                        </button>
                      )}
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
