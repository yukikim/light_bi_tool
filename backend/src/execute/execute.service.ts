import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PoolClient } from "pg";
import { getEnv } from "../config/env";
import { DbService } from "../db/db.service";
import { compileNamedParams } from "./compileNamedParams";
import { checkSqlSafety } from "./sqlSafety";

type DbQueryRow = { id: number; sql: string };

export type ExecuteResponse = {
  columns: string[];
  rows: Record<string, unknown>[];
};

@Injectable()
export class ExecuteService {
  constructor(private readonly db: DbService) {}

  async execute(input: { queryId: number; params: Record<string, unknown> }): Promise<ExecuteResponse> {
    if (!Number.isFinite(input.queryId)) {
      throw new BadRequestException("queryId が不正です");
    }

    const queryResult = await this.db.query<DbQueryRow>(
      `SELECT id, sql
       FROM queries
       WHERE id = $1`,
      [input.queryId],
    );
    const queryRow = queryResult.rows[0];
    if (!queryRow) throw new NotFoundException("クエリが見つかりません");

    let sql = String(queryRow.sql ?? "").trim();
    if (sql.endsWith(";")) sql = sql.slice(0, -1);

    const safety = checkSqlSafety(sql);
    if (!safety.ok) {
      throw new BadRequestException(safety.message);
    }

    const env = getEnv();
    const maxRows = env.MAX_RESULT_ROWS;
    const timeoutMs = env.EXECUTE_TIMEOUT_MS;

    let compiled;
    try {
      compiled = compileNamedParams(sql, input.params);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.startsWith("missing_param:")) {
        throw new BadRequestException(`必須パラメータが不足しています: ${msg.replace("missing_param:", "")}`);
      }
      throw e;
    }

    // 強制LIMIT: 元SQLをサブクエリ化して必ず上限をかける
    const wrappedSql = `SELECT * FROM (\n${compiled.sql}\n) AS __q LIMIT $${compiled.values.length + 1}`;
    const values = [...compiled.values, maxRows];

    const startedAt = Date.now();
    try {
      const result = await this.db.withClient(async (client: PoolClient) => {
        await client.query("BEGIN");
        await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);

        const r = await client.query(wrappedSql, values);
        await client.query("COMMIT");
        return r;
      });

      const durationMs = Date.now() - startedAt;

      const columns = result.fields.map((f) => f.name);
      const rows = result.rows as Record<string, unknown>[];

      await this.db.query(
        `INSERT INTO query_executions (query_id, duration_ms, row_count, params)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [input.queryId, durationMs, rows.length, JSON.stringify(input.params)],
      );

      return { columns, rows };
    } catch (error: any) {
      const durationMs = Date.now() - startedAt;
      const message = String(error?.message ?? "execute error");
      const code = String(error?.code ?? "UNKNOWN");

      await this.db
        .query(
          `INSERT INTO query_executions (query_id, duration_ms, row_count, params, error_code, error_message)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
          [input.queryId, durationMs, 0, JSON.stringify(input.params), code, message.slice(0, 2000)],
        )
        .catch(() => undefined);

      // pgのエラー詳細をそのまま出し過ぎない
      throw new BadRequestException("SQL実行に失敗しました");
    }
  }
}
