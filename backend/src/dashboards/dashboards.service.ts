import { Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "../db/db.service";

export type DashboardDto = {
  id: number;
  name: string;
  createdAt: string;
};

type DbDashboardRow = {
  id: number;
  name: string;
  created_at: Date;
};

function mapDashboard(row: DbDashboardRow): DashboardDto {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class DashboardsService {
  constructor(private readonly db: DbService) {}

  async list(): Promise<DashboardDto[]> {
    const result = await this.db.query<DbDashboardRow>(
      `SELECT id, name, created_at
       FROM dashboards
       ORDER BY id DESC`,
    );
    return result.rows.map(mapDashboard);
  }

  async getById(id: number): Promise<DashboardDto> {
    const result = await this.db.query<DbDashboardRow>(
      `SELECT id, name, created_at
       FROM dashboards
       WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException("ダッシュボードが見つかりません");
    return mapDashboard(row);
  }

  async create(input: { name: string }): Promise<DashboardDto> {
    const result = await this.db.query<DbDashboardRow>(
      `INSERT INTO dashboards (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [input.name],
    );
    return mapDashboard(result.rows[0]!);
  }
}
