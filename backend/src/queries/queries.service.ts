import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "../db/db.service";
import type { PoolClient } from "pg";

export type QueryParamType = "string" | "number" | "date" | "boolean";

export type QueryParamDef = {
  name: string;
  label?: string;
  type: QueryParamType;
  required?: boolean;
  default?: string | number | boolean;
};

export type QueryDto = {
  id: number;
  name: string;
  sql: string;
  paramDefs: QueryParamDef[];
  createdAt: string;
  updatedAt: string;
};

type DbQueryRow = {
  id: number;
  name: string;
  sql: string;
  param_defs: unknown;
  created_at: Date;
  updated_at: Date;
};

function mapQuery(row: DbQueryRow): QueryDto {
  return {
    id: row.id,
    name: row.name,
    sql: row.sql,
    paramDefs: Array.isArray(row.param_defs) ? (row.param_defs as QueryParamDef[]) : [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class QueriesService {
  constructor(private readonly db: DbService) {}

  async list(): Promise<QueryDto[]> {
    const result = await this.db.query<DbQueryRow>(
      `SELECT id, name, sql, param_defs, created_at, updated_at
       FROM queries
       ORDER BY id DESC`,
    );
    return result.rows.map(mapQuery);
  }

  async getById(id: number): Promise<QueryDto> {
    const result = await this.db.query<DbQueryRow>(
      `SELECT id, name, sql, param_defs, created_at, updated_at
       FROM queries
       WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException("クエリが見つかりません");
    return mapQuery(row);
  }

  async create(input: { name: string; sql: string; paramDefs?: QueryParamDef[] }): Promise<QueryDto> {
    const result = await this.db.query<DbQueryRow>(
      `INSERT INTO queries (name, sql, param_defs)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, name, sql, param_defs, created_at, updated_at`,
      [input.name, input.sql, JSON.stringify(input.paramDefs ?? [])],
    );
    return mapQuery(result.rows[0]!);
  }

  async update(
    id: number,
    input: { name: string; sql: string; paramDefs?: QueryParamDef[] },
  ): Promise<QueryDto> {
    const result = await this.db.query<DbQueryRow>(
      `UPDATE queries
       SET name = $2,
           sql = $3,
           param_defs = COALESCE($4::jsonb, param_defs),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, sql, param_defs, created_at, updated_at`,
      [id, input.name, input.sql, input.paramDefs ? JSON.stringify(input.paramDefs) : null],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException("クエリが見つかりません");
    return mapQuery(row);
  }

  async remove(id: number): Promise<{ id: number }> {
    return this.removeWithOptions(id, { force: false });
  }

  async removeWithOptions(id: number, options: { force: boolean }): Promise<{ id: number }> {
    return this.db.withClient(async (client: PoolClient) => {
      await client.query("BEGIN");
      try {
        const widgetCountResult = await client.query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM widgets
           WHERE query_id = $1`,
          [id],
        );
        const widgetCount = Number(widgetCountResult.rows[0]?.count ?? 0);

        if (!options.force && widgetCount > 0) {
          await client.query("ROLLBACK");
          throw new ConflictException(
            `このクエリは ${widgetCount} 件のウィジェットで使用されています。削除するとウィジェットも削除されます。続行しますか？`,
          );
        }

        if (options.force && widgetCount > 0) {
          // widgets.query_id は ON DELETE RESTRICT のため、先に参照ウィジェットを削除する
          await client.query(
            `DELETE FROM widgets
             WHERE query_id = $1`,
            [id],
          );
        }

        const result = await client.query<{ id: number }>(
          `DELETE FROM queries
           WHERE id = $1
           RETURNING id`,
          [id],
        );

        const row = result.rows[0];
        if (!row) throw new NotFoundException("クエリが見つかりません");

        await client.query("COMMIT");
        return row;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    });
  }
}
