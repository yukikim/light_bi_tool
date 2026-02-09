export type MockDashboard = {
  id: number;
  name: string;
  createdAt: string;
};

export type MockQuery = {
  id: number;
  name: string;
  sql: string;
  dataSourceId?: number;
  paramDefs?: MockQueryParamDef[];
};

export type MockQueryParamType = "string" | "number" | "date" | "boolean";

export type MockQueryParamDef = {
  name: string;
  label?: string;
  type: MockQueryParamType;
  required?: boolean;
  default?: string | number | boolean;
};

export type MockWidgetType = "table" | "line" | "bar";

export type MockWidget = {
  id: number;
  dashboardId: number;
  queryId: number;
  name: string;
  type: MockWidgetType;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
};

let dashboardIdSeq = 1;
let widgetIdSeq = 1;
let queryIdSeq = 1;

const dashboards: MockDashboard[] = [
  {
    id: dashboardIdSeq++,
    name: "サンプルダッシュボード",
    createdAt: new Date().toISOString(),
  },
];

const widgets: MockWidget[] = [
  {
    id: widgetIdSeq++,
    dashboardId: 1,
    queryId: 1,
    name: "売上推移（折れ線）",
    type: "line",
    config: { xKey: "date", yKeys: ["sales"] },
    positionX: 0,
    positionY: 0,
    width: 4,
    height: 3,
  },
  {
    id: widgetIdSeq++,
    dashboardId: 1,
    queryId: 2,
    name: "カテゴリ別売上（棒）",
    type: "bar",
    config: { xKey: "category", yKeys: ["sales"] },
    positionX: 4,
    positionY: 0,
    width: 4,
    height: 3,
  },
];

const queries: MockQuery[] = [
  {
    id: queryIdSeq++,
    name: "売上推移（折れ線）クエリ",
    sql: "SELECT date, sales FROM sales_daily ORDER BY date",
  },
  {
    id: queryIdSeq++,
    name: "カテゴリ別売上クエリ",
    sql: "SELECT category, sales FROM sales_by_category ORDER BY sales DESC",
  },
];

export function getDashboards(): MockDashboard[] {
  return dashboards;
}

export function createDashboard(name: string): MockDashboard {
  const dashboard: MockDashboard = {
    id: dashboardIdSeq++,
    name,
    createdAt: new Date().toISOString(),
  };
  dashboards.push(dashboard);
  return dashboard;
}

export function getDashboardById(id: number): MockDashboard | undefined {
  return dashboards.find((d) => d.id === id);
}

export function deleteDashboard(id: number): boolean {
  const index = dashboards.findIndex((d) => d.id === id);
  if (index === -1) return false;

  dashboards.splice(index, 1);

  for (let i = widgets.length - 1; i >= 0; i--) {
    if (widgets[i].dashboardId === id) {
      widgets.splice(i, 1);
    }
  }

  return true;
}

export function getWidgetsByDashboardId(dashboardId: number): MockWidget[] {
  return widgets.filter((w) => w.dashboardId === dashboardId);
}

export function getWidgetById(id: number): MockWidget | undefined {
  return widgets.find((w) => w.id === id);
}

export function updateWidget(
  id: number,
  patch: Partial<Pick<MockWidget, "queryId" | "name" | "type" | "config" | "positionX" | "positionY" | "width" | "height">>,
): MockWidget | undefined {
  const w = widgets.find((x) => x.id === id);
  if (!w) return undefined;

  if (patch.queryId !== undefined) w.queryId = patch.queryId;
  if (patch.name !== undefined) w.name = patch.name;
  if (patch.type !== undefined) w.type = patch.type;
  if (patch.config !== undefined) w.config = patch.config;
  if (patch.positionX !== undefined) w.positionX = patch.positionX;
  if (patch.positionY !== undefined) w.positionY = patch.positionY;
  if (patch.width !== undefined) w.width = patch.width;
  if (patch.height !== undefined) w.height = patch.height;

  return w;
}

export function createWidget(input: {
  dashboardId: number;
  queryId: number;
  name: string;
  type: MockWidgetType;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}): MockWidget {
  // ざっくり配置: 既存Widget数に応じて左上から並べる
  const existing = getWidgetsByDashboardId(input.dashboardId);
  const index = existing.length;

  const widget: MockWidget = {
    id: widgetIdSeq++,
    dashboardId: input.dashboardId,
    queryId: input.queryId,
    name: input.name,
    type: input.type,
    config: input.config,
    positionX: input.positionX ?? (index % 3) * 4,
    positionY: input.positionY ?? Math.floor(index / 3) * 3,
    width: input.width ?? 4,
    height: input.height ?? 3,
  };

  widgets.push(widget);
  return widget;
}

export function compactWidgetsLayout(dashboardId: number): MockWidget[] {
  const target = widgets
    .filter((w) => w.dashboardId === dashboardId)
    .sort((a, b) => {
      const ay = a.positionY ?? 0;
      const by = b.positionY ?? 0;
      if (ay !== by) return ay - by;
      const ax = a.positionX ?? 0;
      const bx = b.positionX ?? 0;
      if (ax !== bx) return ax - bx;
      return a.id - b.id;
    });

  // 3列グリッド想定（将来 grid-layout へ移行しても、基準の整列として維持できる）
  for (let i = 0; i < target.length; i++) {
    const w = target[i];
    w.positionX = (i % 3) * 4;
    w.positionY = Math.floor(i / 3) * 3;
    w.width = w.width ?? 4;
    w.height = w.height ?? 3;
  }

  return target;
}

export function deleteWidget(id: number): boolean {
  const index = widgets.findIndex((w) => w.id === id);
  if (index === -1) return false;

  const dashboardId = widgets[index].dashboardId;
  widgets.splice(index, 1);
  compactWidgetsLayout(dashboardId);
  return true;
}

export function getQueries(): MockQuery[] {
  return queries;
}

export function getQueryById(id: number): MockQuery | undefined {
  return queries.find((q) => q.id === id);
}

export function createQuery(name: string, sql: string): MockQuery {
  const query: MockQuery = {
    id: queryIdSeq++,
    name,
    sql,
  };
  queries.push(query);
  return query;
}

export function updateQuery(
  id: number,
  patch: Partial<Pick<MockQuery, "name" | "sql" | "paramDefs">>,
): MockQuery | undefined {
  const q = queries.find((x) => x.id === id);
  if (!q) return undefined;
  if (patch.name !== undefined) q.name = patch.name;
  if (patch.sql !== undefined) q.sql = patch.sql;
  if (patch.paramDefs !== undefined) q.paramDefs = patch.paramDefs;
  return q;
}
