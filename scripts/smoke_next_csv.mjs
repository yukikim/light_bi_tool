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

async function toFormDataWithFile({ filename, content }) {
  // Node 18+ has global FormData/Blob
  const form = new FormData();
  const blob = new Blob([content], { type: "text/csv" });
  form.append("file", blob, filename);
  return form;
}

async function main() {
  const email = `smoke-csv+${Date.now()}@example.com`;
  const password = "SmokePass1234";

  // register
  {
    const res = await fetch(`${nextBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `register failed: ${res.status} ${JSON.stringify(body)}`);
  }

  // login
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

  const csv = [
    "date,sales,profit",
    "2026-02-01,100,30",
    "2026-02-02,140,20",
    "2026-02-03,90,10",
  ].join("\n");

  // upload
  let dashboardId;
  let widgetId;
  let queryId;
  {
    const form = await toFormDataWithFile({ filename: "sample.csv", content: csv });
    const res = await fetch(`${nextBase}/csv/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `csv upload failed: ${res.status} ${JSON.stringify(body)}`);
    const data = body?.data ?? body;
    dashboardId = data?.dashboardId;
    widgetId = data?.widgetId;
    queryId = data?.queryId;
    assertOk(Number.isFinite(Number(dashboardId)), `dashboardId invalid: ${dashboardId}`);
    assertOk(Number.isFinite(Number(widgetId)), `widgetId invalid: ${widgetId}`);
    assertOk(Number.isFinite(Number(queryId)), `queryId invalid: ${queryId}`);
  }

  // dashboard should be readable
  {
    const res = await fetch(`${nextBase}/dashboards/${dashboardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `get dashboard failed: ${res.status} ${JSON.stringify(body)}`);
  }

  // widget should exist
  {
    const res = await fetch(`${nextBase}/widgets?dashboardId=${dashboardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `list widgets failed: ${res.status} ${JSON.stringify(body)}`);
    const data = body?.data ?? body;
    assertOk(Array.isArray(data), "widgets list shape invalid");
    const found = data.find((w) => Number(w?.id) === Number(widgetId));
    assertOk(!!found, "created widget not found");
    assertOk(Number(found.queryId) === Number(queryId), "widget.queryId mismatch");
  }

  // execute should return rows
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
    const data = body?.data ?? body;
    assertOk(Array.isArray(data?.columns), "execute.columns missing");
    assertOk(Array.isArray(data?.rows), "execute.rows missing");
    assertOk(data.rows.length >= 1, "execute returned no rows");
    // for this sample, should have at least these columns
    const cols = data.columns.map(String);
    assertOk(cols.includes("date"), "missing 'date' column");
    assertOk(cols.includes("sales"), "missing 'sales' column");
    assertOk(cols.includes("profit"), "missing 'profit' column");
  }

  console.log("OK: Next proxy CSV upload -> widget exists -> execute returns rows");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
