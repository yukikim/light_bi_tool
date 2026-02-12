"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Layout, LayoutItem } from "react-grid-layout";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
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
  const { width: gridWidth, containerRef: gridContainerRef, mounted: gridMounted } = useContainerWidth();
  const widgetsRef = useRef<Widget[]>([]);
  const pendingLayoutRef = useRef<Layout | null>(null);
  const layoutSaveTimerRef = useRef<number | null>(null);
  const flushingLayoutRef = useRef(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [draftFrom, setDraftFrom] = useState<string>("");
  const [draftTo, setDraftTo] = useState<string>("");
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingWidgetIds, setSavingWidgetIds] = useState<Set<string>>(new Set());
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [isFlushingLayout, setIsFlushingLayout] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState<string>("");
  const [createType, setCreateType] = useState<WidgetType>("table");
  const [createQueryId, setCreateQueryId] = useState<string>("");
  const [createConfigText, setCreateConfigText] = useState<string>("");
  const [createWidth, setCreateWidth] = useState<string>("4");
  const [createHeight, setCreateHeight] = useState<string>("3");
  const [isCreating, setIsCreating] = useState(false);

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editType, setEditType] = useState<WidgetType>("table");
  const [editConfigText, setEditConfigText] = useState<string>("");
  const [editWidth, setEditWidth] = useState<string>("");
  const [editHeight, setEditHeight] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const getConfigTemplateText = (type: WidgetType): string => {
    if (type === "line") {
      return JSON.stringify(
        {
          xKey: "date",
          series: [
            { yKey: "sales", label: "売上", axis: "left" },
            { yKey: "profit", label: "利益", axis: "right" },
          ],
          options: { showLegend: true, showGrid: true, showTooltip: true, numberFormat: "comma" },
        },
        null,
        2,
      );
    }
    if (type === "bar") {
      return JSON.stringify(
        {
          xKey: "category",
          series: [
            { yKey: "sales", label: "売上", axis: "left" },
            { yKey: "orders", label: "注文件数", axis: "right" },
          ],
          options: { stacked: false, showLegend: true, showGrid: true, showTooltip: true, numberFormat: "comma" },
        },
        null,
        2,
      );
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
    widgetsRef.current = widgets;
  }, [widgets]);

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

  useEffect(() => {
    return () => {
      if (layoutSaveTimerRef.current !== null) {
        window.clearTimeout(layoutSaveTimerRef.current);
        layoutSaveTimerRef.current = null;
      }
    };
  }, []);

  const handleApplyFilter = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setHasAppliedFilter(true);
    // 今はまだ実際の再フェッチまでは行わず、後でExecute API実装時に連動させる
    console.log("apply filter", { from: draftFrom, to: draftTo });
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

    const widthNum = Number(createWidth);
    if (!Number.isFinite(widthNum) || widthNum <= 0 || widthNum > 12) {
      setError("幅（w）は 1〜12 の数値で入力してください");
      return;
    }

    const heightNum = Number(createHeight);
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      setError("高さ（h）は 1以上の数値で入力してください");
      return;
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
        width: widthNum,
        height: heightNum,
      });

      setWidgets((current) => [...current, created]);
      setCreateName("");
      setCreateConfigText("");
      setCreateWidth("4");
      setCreateHeight("3");
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
      // サーバ側で自動整列(compact)されるので、削除後は再取得して座標を揃える
      const ws = await fetchWidgets(token, params.id);
      setWidgets(ws);
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
    setEditWidth(String(widget.width ?? 4));
    setEditHeight(String(widget.height ?? 3));
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

    const widthNum = Number(editWidth);
    if (!Number.isFinite(widthNum) || widthNum <= 0 || widthNum > 12) {
      setEditError("幅（w）は 1〜12 の数値で入力してください");
      return;
    }

    const heightNum = Number(editHeight);
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      setEditError("高さ（h）は 1以上の数値で入力してください");
      return;
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
        width: widthNum,
        height: heightNum,
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

  const buildLayout = (): Layout => {
    return widgets.map((w) => {
      const x = Number((w.positionX ?? 0) as number);
      const y = Number((w.positionY ?? 0) as number);
      const width = Number((w.width ?? 4) as number);
      const height = Number((w.height ?? 3) as number);
      return {
        i: String(w.id),
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        w: Number.isFinite(width) ? width : 4,
        h: Number.isFinite(height) ? height : 3,
      };
    });
  };

  const flushLayoutSave = async () => {
    if (flushingLayoutRef.current) return;

    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const layout = pendingLayoutRef.current;
    if (!layout) return;

    pendingLayoutRef.current = null;
    flushingLayoutRef.current = true;
    setIsFlushingLayout(true);

    const currentWidgets = widgetsRef.current;
    const updates: Array<{ widgetId: string; next: LayoutItem }> = [];
    for (const item of layout) {
      const widgetId = String(item.i);
      const w = currentWidgets.find((x) => String(x.id) === widgetId);
      if (!w) continue;

      const curX = Number((w.positionX ?? 0) as number);
      const curY = Number((w.positionY ?? 0) as number);
      const curW = Number((w.width ?? 4) as number);
      const curH = Number((w.height ?? 3) as number);

      if (curX === item.x && curY === item.y && curW === item.w && curH === item.h) continue;
      updates.push({ widgetId, next: item });
    }

    if (updates.length === 0) {
      flushingLayoutRef.current = false;
      setIsFlushingLayout(false);
      setLayoutDirty(pendingLayoutRef.current !== null);
      return;
    }

    setSavingWidgetIds((prev) => {
      const next = new Set(prev);
      for (const u of updates) next.add(u.widgetId);
      return next;
    });

    try {
      const results = await Promise.allSettled(
        updates.map((u) =>
          updateWidgetApi(token, u.widgetId, {
            positionX: u.next.x,
            positionY: u.next.y,
            width: u.next.w,
            height: u.next.h,
          }),
        ),
      );

      const updatedById = new Map<string, Widget>();
      const errors: string[] = [];
      results.forEach((r, idx) => {
        const id = updates[idx]?.widgetId;
        if (!id) return;
        if (r.status === "fulfilled") {
          updatedById.set(id, r.value);
        } else {
          errors.push(r.reason instanceof Error ? r.reason.message : "レイアウトの保存に失敗しました");
        }
      });

      if (updatedById.size > 0) {
        setWidgets((current) =>
          current.map((w) => {
            const id = String(w.id);
            return updatedById.get(id) ?? w;
          }),
        );
      }

      if (errors.length > 0) {
        setError(errors[0]);
      }
    } finally {
      setSavingWidgetIds((prev) => {
        const next = new Set(prev);
        for (const u of updates) next.delete(u.widgetId);
        return next;
      });
      flushingLayoutRef.current = false;
      setIsFlushingLayout(false);
      setLayoutDirty(pendingLayoutRef.current !== null);
      if (pendingLayoutRef.current) {
        void flushLayoutSave();
      }
    }
  };

  const queueLayoutSave = (layout: Layout) => {
    pendingLayoutRef.current = layout;
    setLayoutDirty(true);
    if (layoutSaveTimerRef.current !== null) {
      window.clearTimeout(layoutSaveTimerRef.current);
    }
    layoutSaveTimerRef.current = window.setTimeout(() => {
      layoutSaveTimerRef.current = null;
      void flushLayoutSave();
    }, 600);
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
            <div
              aria-live="polite"
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              title="ドラッグ/リサイズ後の保存状況"
            >
              {isFlushingLayout || savingWidgetIds.size > 0 ? (
                <span className="text-zinc-900 dark:text-zinc-50">
                  保存中...{savingWidgetIds.size > 0 ? ` (${savingWidgetIds.size})` : ""}
                </span>
              ) : layoutDirty ? (
                <span className="text-amber-700 dark:text-amber-400">保存待ち...</span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">保存済み</span>
              )}
            </div>
            <div className="flex flex-col text-xs text-zinc-600 dark:text-zinc-300">
              <span className="mb-1">期間（from/to）</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 "
                />
                <span className="self-center text-zinc-500">〜</span>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 "
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyFilter}
              disabled={hasAppliedFilter && draftFrom === from && draftTo === to}
              className={
                hasAppliedFilter && draftFrom === from && draftTo === to
                  ? "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  : "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              }
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

              <div>
                <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">幅（w）</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={createWidth}
                  onChange={(e) => setCreateWidth(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  placeholder="1-12"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">高さ（h）</label>
                <input
                  type="number"
                  min={1}
                  value={createHeight}
                  onChange={(e) => setCreateHeight(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
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
          <div>
            <div ref={gridContainerRef}>
              {gridMounted && (
                <ResponsiveGridLayout
                  width={gridWidth}
                  className="layout"
                  layouts={{
                    lg: buildLayout(),
                    md: buildLayout(),
                    sm: buildLayout(),
                    xs: buildLayout(),
                    xxs: buildLayout(),
                  }}
                  cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  rowHeight={72}
                  margin={[16, 16]}
                  containerPadding={[0, 0]}
                  dragConfig={{
                    enabled: true,
                    bounded: false,
                    handle: ".widget-drag-handle",
                    cancel: "button, a, input, textarea, select",
                    threshold: 3,
                  }}
                  resizeConfig={{ enabled: true }}
                  onLayoutChange={(layout) => {
                    queueLayoutSave(layout);
                  }}
                >
                  {widgets.map((w) => (
                    <div key={String(w.id)}>
                      <WidgetContainer>
                        <div className="widget-drag-handle">
                          <WidgetHeader
                            title={w.name ?? `Widget ${w.id}`}
                            onEdit={() => openEditWidget(w)}
                            onDelete={() => handleDeleteWidget(w)}
                          />
                        </div>

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

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">幅（w）</label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={editWidth}
                                onChange={(e) => setEditWidth(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                                placeholder="1-12"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">高さ（h）</label>
                              <input
                                type="number"
                                min={1}
                                value={editHeight}
                                onChange={(e) => setEditHeight(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                              />
                            </div>
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
                          className="w-full max-w-55 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
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

                    <WidgetRenderer
                      widget={w}
                      queryParamDefs={queries.find((q) => String(q.id) === String(w.queryId))?.paramDefs}
                      globalParams={{ from, to }}
                    />
                      </WidgetContainer>
                    </div>
                  ))}
                </ResponsiveGridLayout>
              )}
            </div>

            {widgets.length === 0 && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                このダッシュボードにはまだウィジェットがありません。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
