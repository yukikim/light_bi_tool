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
  parameters?: Record<string, unknown>;
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

export function getWidgetsByDashboardId(dashboardId: number): MockWidget[] {
  return widgets.filter((w) => w.dashboardId === dashboardId);
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

export function updateQuery(id: number, patch: Partial<Pick<MockQuery, "name" | "sql">>): MockQuery | undefined {
  const q = queries.find((x) => x.id === id);
  if (!q) return undefined;
  if (patch.name !== undefined) q.name = patch.name;
  if (patch.sql !== undefined) q.sql = patch.sql;
  return q;
}
