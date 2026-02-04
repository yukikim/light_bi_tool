const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LoginResponse = {
  token: string;
};

export type Dashboard = {
  id: string | number;
  name: string;
  createdAt?: string;
};

export type Query = {
  id: string | number;
  name: string;
  sql: string;
  paramDefs?: QueryParamDef[];
};

export type QueryParamType = "string" | "number" | "date" | "boolean";

export type QueryParamDef = {
  name: string;
  label?: string;
  type: QueryParamType;
  required?: boolean;
  default?: string | number | boolean;
};

export type WidgetType = "table" | "line" | "bar";

export type Widget = {
  id: string | number;
  dashboardId: string | number;
  queryId: string | number;
  name?: string;
  type: WidgetType;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
};

export type ExecuteParams = Record<string, unknown>;

export type ExecuteResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

function getBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured (NEXT_PUBLIC_API_BASE_URL)");
  }

  return API_BASE_URL;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ログインに失敗しました";
    throw new Error(message);
  }

  if (!json?.token) {
    throw new Error("サーバーからトークンが返却されませんでした");
  }

  return { token: json.token };
}

export async function fetchDashboards(token: string): Promise<Dashboard[]> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/dashboards`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ダッシュボード一覧の取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  if (!Array.isArray(data)) {
    return [];
  }

  return data as Dashboard[];
}

export async function createDashboard(token: string, name: string): Promise<Dashboard> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/dashboards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ダッシュボードの作成に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Dashboard;
}

export async function fetchDashboard(token: string, id: string | number): Promise<Dashboard> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/dashboards/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ダッシュボードの取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Dashboard;
}

export async function fetchWidgets(token: string, dashboardId: string | number): Promise<Widget[]> {
  const baseUrl = getBaseUrl();

  const url = new URL(`${baseUrl}/widgets`);
  url.searchParams.set("dashboardId", String(dashboardId));

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ウィジェット一覧の取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  if (!Array.isArray(data)) return [];

  return data as Widget[];
}

export async function updateWidgetApi(
  token: string,
  id: string | number,
  payload: Partial<Pick<Widget, "queryId" | "name" | "type" | "config" | "positionX" | "positionY" | "width" | "height">>,
): Promise<Widget> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/widgets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ウィジェットの更新に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Widget;
}

export async function createWidgetApi(
  token: string,
  payload: {
    dashboardId: string | number;
    queryId: string | number;
    name: string;
    type: WidgetType;
    config?: Record<string, unknown>;
  },
): Promise<Widget> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/widgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ウィジェットの作成に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Widget;
}

export async function deleteWidgetApi(
  token: string,
  id: string | number,
): Promise<{ id: string | number }> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/widgets/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "ウィジェットの削除に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as { id: string | number };
}

export async function executeQuery(
  token: string,
  queryId: string | number,
  params: ExecuteParams,
): Promise<ExecuteResult> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ queryId, params }),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "データの取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as ExecuteResult;
}

export async function fetchQueries(token: string): Promise<Query[]> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/queries`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "クエリ一覧の取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  if (!Array.isArray(data)) return [];
  return data as Query[];
}

export async function fetchQuery(token: string, id: string | number): Promise<Query> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/queries/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "クエリの取得に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Query;
}

export async function createQueryApi(token: string, name: string, sql: string): Promise<Query> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/queries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, sql }),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "クエリの作成に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Query;
}

export async function updateQueryApi(
  token: string,
  id: string | number,
  payload: { name: string; sql: string; paramDefs?: QueryParamDef[] },
): Promise<Query> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/queries/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? "クエリの更新に失敗しました";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as Query;
}
