"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  fetchDashboard,
  fetchWidgets,
  fetchQueries,
  createWidgetApi,
  deleteWidgetApi,
  updateWidgetApi,
  type Dashboard,
  type Query,
  type Widget,
  type WidgetType,
} from "@/lib/apiClient";
import { WidgetContainer } from "@/app/components/widgets/WidgetContainer";
import { WidgetHeader } from "@/app/components/widgets/WidgetHeader";
import { WidgetRenderer } from "@/app/components/widgets/WidgetRenderer";

export default function DashboardDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingWidgetIds, setSavingWidgetIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState<string>("");
  const [createType, setCreateType] = useState<WidgetType>("table");
  const [createQueryId, setCreateQueryId] = useState<string>("");
  const [createConfigText, setCreateConfigText] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editType, setEditType] = useState<WidgetType>("table");
  const [editConfigText, setEditConfigText] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const getConfigTemplateText = (type: WidgetType): string => {
    if (type === "line") {
      return JSON.stringify({ xKey: "date", yKeys: ["sales"] }, null, 2);
    }
    if (type === "bar") {
      return JSON.stringify({ xKey: "category", yKeys: ["sales"] }, null, 2);
    }
    // table: 基本は未指定でもOK（将来拡張用に空オブジェクト）
    return "{}";
  };

  const applyConfigTemplate = (type: WidgetType, force = false) => {
    const current = editConfigText.trim();
    if (!force && current.length > 0 && current !== "{}") {
      const ok = window.confirm("config をテンプレで上書きしますか？");
      if (!ok) return;
    }
    setEditConfigText(getConfigTemplateText(type));
  };

  const applyCreateConfigTemplate = (type: WidgetType) => {
    const current = createConfigText.trim();
    if (current.length > 0 && current !== "{}") {
      const ok = window.confirm("config をテンプレで上書きしますか？");
      if (!ok) return;
    }
    setCreateConfigText(getConfigTemplateText(type));
  };

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [d, ws, qs] = await Promise.all([
          fetchDashboard(token, params.id),
          fetchWidgets(token, params.id),
          fetchQueries(token),
        ]);
        setDashboard(d);
        setWidgets(ws);
        setQueries(qs);
        if (!createQueryId && qs.length > 0) {
          setCreateQueryId(String(qs[0].id));
        }
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

  const handleCreateWidget = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const name = createName.trim();
    if (!name) {
      setError("ウィジェット名を入力してください");
      return;
    }

    const queryIdNum = Number(createQueryId);
    if (Number.isNaN(queryIdNum) || queryIdNum <= 0) {
      setError("クエリを選択してください");
      return;
    }

    let config: Record<string, unknown> | undefined;
    const configText = createConfigText.trim();
    if (configText.length > 0) {
      try {
        const parsed = JSON.parse(configText) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          config = parsed as Record<string, unknown>;
        } else {
          setError("config はJSONオブジェクト（{...}）で入力してください");
          return;
        }
      } catch {
        setError("config のJSONが不正です");
        return;
      }
    }

    setIsCreating(true);
    setError(null);

    try {
      const created = await createWidgetApi(token, {
        dashboardId: params.id,
        queryId: queryIdNum,
        name,
        type: createType,
        ...(config !== undefined ? { config } : {}),
      });

      setWidgets((current) => [...current, created]);
      setCreateName("");
      setCreateConfigText("");
      setIsCreateOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ウィジェットの作成に失敗しました";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeWidgetQuery = async (widgetId: Widget["id"], nextQueryId: string) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const nextQueryIdNum = Number(nextQueryId);
    if (Number.isNaN(nextQueryIdNum) || nextQueryIdNum <= 0) return;

    const widgetIdStr = String(widgetId);
    const prevWidgets = widgets;

    setWidgets((current) =>
      current.map((w) => (String(w.id) === widgetIdStr ? { ...w, queryId: nextQueryIdNum } : w)),
    );

    setSavingWidgetIds((prev) => {
      const next = new Set(prev);
      next.add(widgetIdStr);
      return next;
    });

    try {
      const updated = await updateWidgetApi(token, widgetId, { queryId: nextQueryIdNum });
      setWidgets((current) => current.map((w) => (String(w.id) === widgetIdStr ? updated : w)));
    } catch (err) {
      setWidgets(prevWidgets);
      const message = err instanceof Error ? err.message : "ウィジェットの更新に失敗しました";
      setError(message);
    } finally {
      setSavingWidgetIds((prev) => {
        const next = new Set(prev);
        next.delete(widgetIdStr);
        return next;
      });
    }
  };

  const handleDeleteWidget = async (widget: Widget) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const ok = window.confirm(`ウィジェット「${widget.name ?? widget.id}」を削除しますか？`);
    if (!ok) return;

    const widgetIdStr = String(widget.id);
    setSavingWidgetIds((prev) => {
      const next = new Set(prev);
      next.add(widgetIdStr);
      return next;
    });

    try {
      await deleteWidgetApi(token, widget.id);
      setWidgets((current) => current.filter((w) => String(w.id) !== widgetIdStr));
    } catch (err) {
      const message = err instanceof Error ? err.message : "ウィジェットの削除に失敗しました";
      setError(message);
    } finally {
      setSavingWidgetIds((prev) => {
        const next = new Set(prev);
        next.delete(widgetIdStr);
        return next;
      });
    }
  };

  const openEditWidget = (widget: Widget) => {
    setEditError(null);
    setError(null);
    setEditingWidgetId(String(widget.id));
    setEditName(widget.name ?? "");
    setEditType(widget.type);
    setEditConfigText(
      widget.config ? JSON.stringify(widget.config, null, 2) : "",
    );
  };

  const closeEditWidget = () => {
    setEditingWidgetId(null);
    setEditError(null);
  };

  const handleSaveWidgetEdit = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!editingWidgetId) return;

    const name = editName.trim();
    if (!name) {
      setEditError("名前は必須です");
      return;
    }

    let config: Record<string, unknown> | undefined;
    const configText = editConfigText.trim();
    if (configText.length > 0) {
      try {
        const parsed = JSON.parse(configText) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          config = parsed as Record<string, unknown>;
        } else {
          setEditError("config はJSONオブジェクト（{...}）で入力してください");
          return;
        }
      } catch {
        setEditError("config のJSONが不正です");
        return;
      }
    }

    setEditError(null);
    setSavingWidgetIds((prev) => {
      const next = new Set(prev);
      next.add(editingWidgetId);
      return next;
    });

    try {
      const widgetId = editingWidgetId;
      const payload: Parameters<typeof updateWidgetApi>[2] = {
        name,
        type: editType,
        ...(config !== undefined ? { config } : {}),
      };
      const updated = await updateWidgetApi(token, widgetId, payload);
      setWidgets((current) => current.map((w) => (String(w.id) === widgetId ? updated : w)));
      closeEditWidget();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ウィジェットの更新に失敗しました";
      setEditError(message);
    } finally {
      setSavingWidgetIds((prev) => {
        const next = new Set(prev);
        next.delete(editingWidgetId);
        return next;
      });
    }
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

            <button
              type="button"
              onClick={() => setIsCreateOpen((v) => !v)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              ウィジェット追加
            </button>
          </div>
        </header>

        {isCreateOpen && (
          <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">ウィジェット名</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  placeholder="例: 売上推移"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">タイプ</label>
                <select
                  value={createType}
                  onChange={(e) => {
                    const nextType = e.target.value as WidgetType;
                    setCreateType(nextType);
                    if (createConfigText.trim().length === 0) {
                      setCreateConfigText(getConfigTemplateText(nextType));
                    }
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="table">table</option>
                  <option value="bar">bar</option>
                  <option value="line">line</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">クエリ</label>
                <select
                  value={createQueryId}
                  onChange={(e) => setCreateQueryId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  disabled={queries.length === 0}
                >
                  {queries.length === 0 && <option value="">（クエリなし）</option>}
                  {queries.map((q) => (
                    <option key={q.id} value={String(q.id)}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-xs text-zinc-600 dark:text-zinc-300">config（JSON, 任意）</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyCreateConfigTemplate(createType)}
                    className="rounded bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    テンプレ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateConfigText("{}")}
                    className="rounded bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    空オブジェクト
                  </button>
                </div>
              </div>
              <textarea
                value={createConfigText}
                onChange={(e) => setCreateConfigText(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                placeholder='例: {"xKey":"date","yKeys":["sales"]}'
              />
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                未入力の場合は config を送信しません。
              </p>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-md px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreateWidget}
                disabled={isCreating}
                className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isCreating ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        )}

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
                <WidgetHeader
                  title={w.name ?? `Widget ${w.id}`}
                  onEdit={() => openEditWidget(w)}
                  onDelete={() => handleDeleteWidget(w)}
                />

                {editingWidgetId === String(w.id) && (
                  <div className="border-b border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">名前</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">タイプ</label>
                        <select
                          value={editType}
                          onChange={(e) => {
                            const nextType = e.target.value as WidgetType;
                            setEditType(nextType);
                            // configが未入力のときだけ、タイプに応じたテンプレを自動入力
                            if (editConfigText.trim().length === 0) {
                              setEditConfigText(getConfigTemplateText(nextType));
                            }
                          }}
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        >
                          <option value="table">table</option>
                          <option value="bar">bar</option>
                          <option value="line">line</option>
                        </select>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <label className="block text-xs text-zinc-600 dark:text-zinc-300">config（JSON）</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => applyConfigTemplate(editType)}
                              className="rounded bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              テンプレ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditConfigText("{}")}
                              className="rounded bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              空オブジェクト
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={editConfigText}
                          onChange={(e) => setEditConfigText(e.target.value)}
                          rows={6}
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          placeholder='例: {"xKey":"date","yKeys":["sales"]}'
                        />
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          未入力の場合は config を変更しません。
                        </p>
                      </div>
                    </div>

                    {editError && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">{editError}</p>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeEditWidget}
                        className="rounded-md px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        閉じる
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveWidgetEdit}
                        disabled={savingWidgetIds.has(String(w.id))}
                        className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {savingWidgetIds.has(String(w.id)) ? "保存中..." : "保存"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-b border-zinc-200 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  <label className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-zinc-600 dark:text-zinc-300">クエリ</span>
                    <select
                      className="w-full max-w-[220px] rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      value={String(w.queryId)}
                      onChange={(e) => handleChangeWidgetQuery(w.id, e.target.value)}
                      disabled={savingWidgetIds.has(String(w.id)) || queries.length === 0}
                    >
                      {queries.length === 0 && <option value={String(w.queryId)}>（クエリなし）</option>}
                      {queries.map((q) => (
                        <option key={q.id} value={String(q.id)}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

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
