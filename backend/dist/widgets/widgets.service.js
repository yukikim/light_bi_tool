"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db/db.service");
function mapWidget(row) {
    return {
        id: row.id,
        dashboardId: row.dashboard_id,
        queryId: row.query_id,
        name: row.name,
        type: row.type,
        config: (row.config && typeof row.config === "object") ? row.config : {},
        positionX: row.position_x,
        positionY: row.position_y,
        width: row.width,
        height: row.height,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
let WidgetsService = class WidgetsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listByDashboardId(dashboardId) {
        if (!Number.isFinite(dashboardId))
            throw new common_1.BadRequestException("dashboardId が不正です");
        const result = await this.db.query(`SELECT id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at
       FROM widgets
       WHERE dashboard_id = $1
       ORDER BY id ASC`, [dashboardId]);
        return result.rows.map(mapWidget);
    }
    async create(input) {
        const result = await this.db.query(`INSERT INTO widgets (dashboard_id, query_id, name, type, config, position_x, position_y, width, height)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
       RETURNING id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at`, [
            input.dashboardId,
            input.queryId,
            input.name,
            input.type,
            JSON.stringify(input.config ?? {}),
            input.positionX ?? 0,
            input.positionY ?? 0,
            input.width ?? 4,
            input.height ?? 3,
        ]);
        return mapWidget(result.rows[0]);
    }
    async update(id, input) {
        const result = await this.db.query(`UPDATE widgets
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
       RETURNING id, dashboard_id, query_id, name, type, config, position_x, position_y, width, height, created_at, updated_at`, [
            id,
            input.queryId ?? null,
            input.name ?? null,
            input.type ?? null,
            input.config ? JSON.stringify(input.config) : null,
            input.positionX ?? null,
            input.positionY ?? null,
            input.width ?? null,
            input.height ?? null,
        ]);
        const row = result.rows[0];
        if (!row)
            throw new common_1.NotFoundException("ウィジェットが見つかりません");
        return mapWidget(row);
    }
    async remove(id) {
        const result = await this.db.query(`DELETE FROM widgets
       WHERE id = $1
       RETURNING id`, [id]);
        const row = result.rows[0];
        if (!row)
            throw new common_1.NotFoundException("ウィジェットが見つかりません");
        return row;
    }
};
exports.WidgetsService = WidgetsService;
exports.WidgetsService = WidgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], WidgetsService);
//# sourceMappingURL=widgets.service.js.map