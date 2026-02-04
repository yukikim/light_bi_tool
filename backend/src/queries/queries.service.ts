import { Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "../db/db.service";

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
    const result = await this.db.query<{ id: number }>(
      `DELETE FROM queries
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException("クエリが見つかりません");
    return row;
  }
}
