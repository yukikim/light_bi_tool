"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchQuery,
  updateQueryApi,
  type Query,
  type QueryParamDef,
  executeQuery,
  type ExecuteResult,
} from "@/lib/apiClient";
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
  const [paramDefs, setParamDefs] = useState<QueryParamDef[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

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
        const defs = Array.isArray(q.paramDefs) ? q.paramDefs : [];
        setParamDefs(defs);
        setParamValues((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const d of defs) {
            if (!d?.name) continue;
            if (next[d.name] !== undefined) continue;
            if (d.default !== undefined) {
              next[d.name] = String(d.default);
            } else {
              next[d.name] = "";
            }
          }
          return next;
        });
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
      const updated = await updateQueryApi(token, query.id, { name, sql, paramDefs });
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
      const execParams: Record<string, unknown> = {};
      for (const def of paramDefs) {
        const raw = paramValues[def.name] ?? "";
        if (def.required && raw.trim().length === 0) {
          setTestError(`必須パラメータが未入力です: ${def.name}`);
          setIsTesting(false);
          return;
        }

        if (raw.trim().length === 0) continue;

        if (def.type === "number") {
          const n = Number(raw);
          if (Number.isNaN(n)) {
            setTestError(`数値パラメータが不正です: ${def.name}`);
            setIsTesting(false);
            return;
          }
          execParams[def.name] = n;
        } else if (def.type === "boolean") {
          execParams[def.name] = raw === "true";
        } else {
          execParams[def.name] = raw;
        }
      }

      const result = await executeQuery(token, query.id, execParams);
      setTestResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "テスト実行に失敗しました";
      setTestError(message);
    } finally {
      setIsTesting(false);
    }
  };

  const addParamDef = () => {
    setParamDefs((current) => {
      const baseName = "param";
      let n = current.length + 1;
      let candidate = `${baseName}${n}`;
      while (current.some((p) => p.name === candidate)) {
        n += 1;
        candidate = `${baseName}${n}`;
      }
      return [
        ...current,
        { name: candidate, label: candidate, type: "string", required: false },
      ];
    });
  };

  const addFromToTemplate = () => {
    setParamDefs((current) => {
      const next = [...current];
      if (!next.some((p) => p.name === "from")) {
        next.push({ name: "from", label: "from", type: "date", required: false });
      }
      if (!next.some((p) => p.name === "to")) {
        next.push({ name: "to", label: "to", type: "date", required: false });
      }
      return next;
    });
    setParamValues((prev) => ({ ...prev, from: prev.from ?? "", to: prev.to ?? "" }));
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                実行パラメータ定義
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addFromToTemplate}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  from/to 追加
                </button>
                <button
                  type="button"
                  onClick={addParamDef}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  追加
                </button>
              </div>
            </div>

            {paramDefs.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                まだパラメータは定義されていません。
              </p>
            )}

            {paramDefs.length > 0 && (
              <div className="space-y-2">
                {paramDefs.map((p, idx) => (
                  <div
                    key={`${p.name}-${idx}`}
                    className="grid grid-cols-1 gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">name</label>
                      <input
                        defaultValue={p.name}
                        onBlur={(e) => {
                          const nextName = e.target.value;
                          setParamDefs((cur) => cur.map((x, i) => (i === idx ? { ...x, name: nextName } : x)));
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">label</label>
                      <input
                        value={p.label ?? ""}
                        onChange={(e) => {
                          const label = e.target.value;
                          setParamDefs((cur) => cur.map((x, i) => (i === idx ? { ...x, label } : x)));
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">type</label>
                      <select
                        value={p.type}
                        onChange={(e) => {
                          const type = e.target.value as QueryParamDef["type"];
                          setParamDefs((cur) => cur.map((x, i) => (i === idx ? { ...x, type } : x)));
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="date">date</option>
                        <option value="boolean">boolean</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">default</label>
                      <input
                        value={p.default === undefined ? "" : String(p.default)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setParamDefs((cur) =>
                            cur.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    default: raw.length === 0 ? undefined : raw,
                                  }
                                : x,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        placeholder="任意"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 sm:col-span-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={!!p.required}
                          onChange={(e) => {
                            const required = e.target.checked;
                            setParamDefs((cur) => cur.map((x, i) => (i === idx ? { ...x, required } : x)));
                          }}
                        />
                        required
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setParamDefs((cur) => cur.filter((_, i) => i !== idx));
                        }}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {paramDefs.length > 0 && (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {paramDefs.map((p) => {
                const label = p.label?.trim().length ? p.label : p.name;
                const value = paramValues[p.name] ?? "";
                if (p.type === "boolean") {
                  return (
                    <label key={p.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-zinc-700 dark:text-zinc-200">{label}</span>
                      <select
                        value={value || "false"}
                        onChange={(e) => setParamValues((cur) => ({ ...cur, [p.name]: e.target.value }))}
                        className="w-full max-w-48 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    </label>
                  );
                }

                const inputType = p.type === "number" ? "number" : p.type === "date" ? "date" : "text";
                return (
                  <label key={p.name} className="flex flex-col gap-1 text-sm">
                    <span className="text-zinc-700 dark:text-zinc-200">
                      {label}{p.required ? " *" : ""}
                    </span>
                    <input
                      type={inputType}
                      value={value}
                      onChange={(e) => setParamValues((cur) => ({ ...cur, [p.name]: e.target.value }))}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </label>
                );
              })}
            </div>
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
