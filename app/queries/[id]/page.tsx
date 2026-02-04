"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchQuery, updateQueryApi, type Query, executeQuery, type ExecuteResult } from "@/lib/apiClient";
import { TableChart } from "@/app/components/charts/Table";

export default function QueryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [name, setName] = useState("");
  const [sql, setSql] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ExecuteResult | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const q = await fetchQuery(token, params.id);
        setQuery(q);
        setName(q.name);
        setSql(q.sql);
      } catch (err) {
        const message = err instanceof Error ? err.message : "クエリの取得に失敗しました";
        setSaveError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router, params.id]);

  const handleSave = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token || !query) {
      router.replace("/login");
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const updated = await updateQueryApi(token, query.id, { name, sql });
      setQuery(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クエリの更新に失敗しました";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token || !query) {
      router.replace("/login");
      return;
    }

    setTestError(null);
    setIsTesting(true);

    try {
      const result = await executeQuery(token, query.id, {});
      setTestResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "テスト実行に失敗しました";
      setTestError(message);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-red-600 dark:text-red-400">クエリが見つかりません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            クエリ編集 (ID: {query.id})
          </h1>
        </header>

        <div className="space-y-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              クエリ名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              SQL
            </label>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {isTesting ? "テスト実行中..." : "テスト実行"}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">テスト結果</h2>
          {testError && (
            <p className="text-sm text-red-600 dark:text-red-400">{testError}</p>
          )}
          {!testError && !testResult && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">まだテスト実行されていません。</p>
          )}
          {testResult && testResult.rows.length > 0 && (
            <TableChart columns={testResult.columns} rows={testResult.rows} />
          )}
          {testResult && testResult.rows.length === 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">結果データは0件です。</p>
          )}
        </div>
      </div>
    </div>
  );
}
