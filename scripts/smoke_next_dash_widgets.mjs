const nextBase = process.env.NEXT_BASE_URL || "http://localhost:3000";

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonOrText(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function main() {
  const email = `smoke-dw+${Date.now()}@example.com`;
  const password = "SmokePass1234";

  // register/login via Next
  {
    const res = await fetch(`${nextBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `register failed: ${res.status} ${JSON.stringify(body)}`);
  }

  let token;
  {
    const res = await fetch(`${nextBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `login failed: ${res.status} ${JSON.stringify(body)}`);
    token = body?.token;
    assertOk(typeof token === "string" && token.length > 10, "token missing");
  }

  // create query
  let queryId;
  {
    const res = await fetch(`${nextBase}/api/queries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "dw_query", sql: "SELECT 1 AS one" }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `create query failed: ${res.status} ${JSON.stringify(body)}`);
    queryId = body?.data?.id;
    assertOk(Number.isFinite(Number(queryId)), `queryId invalid: ${queryId}`);
  }

  // create dashboard
  let dashboardId;
  {
    const res = await fetch(`${nextBase}/dashboards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "dw_dashboard" }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `create dashboard failed: ${res.status} ${JSON.stringify(body)}`);
    dashboardId = body?.data?.id;
    assertOk(Number.isFinite(Number(dashboardId)), `dashboardId invalid: ${dashboardId}`);
  }

  // create widget
  let widgetId;
  {
    const res = await fetch(`${nextBase}/widgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        dashboardId,
        queryId,
        name: "w1",
        type: "table",
        config: {},
      }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `create widget failed: ${res.status} ${JSON.stringify(body)}`);
    widgetId = body?.data?.id;
    assertOk(Number.isFinite(Number(widgetId)), `widgetId invalid: ${widgetId}`);
  }

  // list widgets
  {
    const res = await fetch(`${nextBase}/widgets?dashboardId=${dashboardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `list widgets failed: ${res.status} ${JSON.stringify(body)}`);
    assertOk(Array.isArray(body?.data), "list shape invalid");
    assertOk(body.data.some((w) => Number(w.id) === Number(widgetId)), "created widget not found in list");
  }

  // update widget layout
  {
    const res = await fetch(`${nextBase}/widgets/${widgetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ positionX: 1, positionY: 2, width: 4, height: 6 }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `update widget failed: ${res.status} ${JSON.stringify(body)}`);
  }

  // execute
  {
    const res = await fetch(`${nextBase}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ queryId, params: {} }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `execute failed: ${res.status} ${JSON.stringify(body)}`);
  }

  console.log("OK: Next proxy dashboards/widgets + execute");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
