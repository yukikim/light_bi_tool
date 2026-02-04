const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:4000";

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  const email = `smoke+${Date.now()}@example.com`;
  const password = "SmokePass1234";

  // health
  {
    const res = await fetch(`${baseUrl}/health`);
    assertOk(res.ok, `health failed: ${res.status}`);
  }

  // register
  {
    const res = await fetch(`${baseUrl}/auth/register`, {
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
    const res = await fetch(`${baseUrl}/auth/login`, {
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
    const sql = "SELECT 1 AS one, {{from}}::text AS from_value";
    const res = await fetch(`${baseUrl}/queries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "smoke_query", sql }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `create query failed: ${res.status} ${JSON.stringify(body)}`);
    queryId = body?.data?.id;
    assertOk(Number.isFinite(Number(queryId)), `queryId invalid: ${queryId}`);
  }

  // execute
  {
    const res = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ queryId, params: { from: "2025-01-01" } }),
    });
    const body = await jsonOrText(res);
    assertOk(res.ok, `execute failed: ${res.status} ${JSON.stringify(body)}`);

    const columns = body?.data?.columns;
    const rows = body?.data?.rows;
    assertOk(Array.isArray(columns) && Array.isArray(rows), "execute response shape invalid");
    assertOk(rows.length >= 1, "no rows returned");
  }

  console.log("OK: register -> login -> create query -> execute");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
