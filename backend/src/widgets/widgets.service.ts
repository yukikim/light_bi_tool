import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "../db/db.service";

export type WidgetType = "table" | "line" | "bar";

export type WidgetDto = {
  id: number;
  dashboardId: number;
  queryId: number;
  name: string;
  type: WidgetType;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

type DbWidgetRow = {
  id: number;
  dashboard_id: number;
  query_id: number;
  name: string;
  type: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: Date;
  updated_at: Date;
};

function mapWidget(row: DbWidgetRow): WidgetDto {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    queryId: row.query_id,
    name: row.name,
    type: row.type as WidgetType,
    config: (row.config && typeof row.config === "object") ? (row.config as Record<string, unknown>) : {},
    positionX: row.position_x,
    positionY: row.position_y,
    width: row.width,
    height: row.height,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class WidgetsService {
  constructor(private readonly db: DbService) {}

  async listByDashboardId(dashboardId: number): Promise<WidgetDto[]> {
    if (!Number.isFinite(dashboardId)) throw new BadRequestException("dashboardId が不正です");

    const result = await this.db.query<DbWidgetRow>(
      `SELECT id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at
       FROM widgets
       WHERE dashboard_id = $1
       ORDER BY id ASC`,
      [dashboardId],
    );

    return result.rows.map(mapWidget);
  }

  async create(input: {
    dashboardId: number;
    queryId: number;
    name: string;
    type: WidgetType;
    config?: Record<string, unknown>;
  }): Promise<WidgetDto> {
    const result = await this.db.query<DbWidgetRow>(
      `INSERT INTO widgets (dashboard_id, query_id, name, type, config)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at`,
      [input.dashboardId, input.queryId, input.name, input.type, JSON.stringify(input.config ?? {})],
    );

    return mapWidget(result.rows[0]!);
  }

  async update(
    id: number,
    input: Partial<{
      queryId: number;
      name: string;
      type: WidgetType;
      config: Record<string, unknown>;
      positionX: number;
      positionY: number;
      width: number;
      height: number;
    }>,
  ): Promise<WidgetDto> {
    const result = await this.db.query<DbWidgetRow>(
      `UPDATE widgets
       SET query_id = COALESCE($2, query_id),
           name = COALESCE($3, name),
           type = COALESCE($4, type),
           config = COALESCE($5::jsonb, config),
           position_x = COALESCE($6, position_x),
           position_y = COALESCE($7, position_y),
           width = COALESCE($8, width),
           height = COALESCE($9, height),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at`,
      [
        id,
        input.queryId ?? null,
        input.name ?? null,
        input.type ?? null,
        input.config ? JSON.stringify(input.config) : null,
        input.positionX ?? null,
        input.positionY ?? null,
        input.width ?? null,
        input.height ?? null,
      ],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException("ウィジェットが見つかりません");
    return mapWidget(row);
  }

  async remove(id: number): Promise<{ id: number }> {
    const result = await this.db.query<{ id: number }>(
      `DELETE FROM widgets
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException("ウィジェットが見つかりません");
    return row;
  }
}
