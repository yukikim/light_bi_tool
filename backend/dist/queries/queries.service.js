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
exports.QueriesService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db/db.service");
function mapQuery(row) {
    return {
        id: row.id,
        name: row.name,
        sql: row.sql,
        paramDefs: Array.isArray(row.param_defs) ? row.param_defs : [],
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
let QueriesService = class QueriesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        const result = await this.db.query(`SELECT id, name, sql, param_defs, created_at, updated_at
       FROM queries
       ORDER BY id DESC`);
        return result.rows.map(mapQuery);
    }
    async getById(id) {
        const result = await this.db.query(`SELECT id, name, sql, param_defs, created_at, updated_at
       FROM queries
       WHERE id = $1`, [id]);
        const row = result.rows[0];
        if (!row)
            throw new common_1.NotFoundException("クエリが見つかりません");
        return mapQuery(row);
    }
    async create(input) {
        const result = await this.db.query(`INSERT INTO queries (name, sql, param_defs)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, name, sql, param_defs, created_at, updated_at`, [input.name, input.sql, JSON.stringify(input.paramDefs ?? [])]);
        return mapQuery(result.rows[0]);
    }
    async update(id, input) {
        const result = await this.db.query(`UPDATE queries
       SET name = $2,
           sql = $3,
           param_defs = COALESCE($4::jsonb, param_defs),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, sql, param_defs, created_at, updated_at`, [id, input.name, input.sql, input.paramDefs ? JSON.stringify(input.paramDefs) : null]);
        const row = result.rows[0];
        if (!row)
            throw new common_1.NotFoundException("クエリが見つかりません");
        return mapQuery(row);
    }
    async remove(id) {
        return this.removeWithOptions(id, { force: false });
    }
    async removeWithOptions(id, options) {
        return this.db.withClient(async (client) => {
            await client.query("BEGIN");
            try {
                const widgetCountResult = await client.query(`SELECT COUNT(*) AS count
           FROM widgets
           WHERE query_id = $1`, [id]);
                const widgetCount = Number(widgetCountResult.rows[0]?.count ?? 0);
                if (!options.force && widgetCount > 0) {
                    await client.query("ROLLBACK");
                    throw new common_1.ConflictException(`このクエリは ${widgetCount} 件のウィジェットで使用されています。削除するとウィジェットも削除されます。続行しますか？`);
                }
                if (options.force && widgetCount > 0) {
                    await client.query(`DELETE FROM widgets
             WHERE query_id = $1`, [id]);
                }
                const result = await client.query(`DELETE FROM queries
           WHERE id = $1
           RETURNING id`, [id]);
                const row = result.rows[0];
                if (!row)
                    throw new common_1.NotFoundException("クエリが見つかりません");
                await client.query("COMMIT");
                return row;
            }
            catch (err) {
                await client.query("ROLLBACK");
                throw err;
            }
        });
    }
};
exports.QueriesService = QueriesService;
exports.QueriesService = QueriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], QueriesService);
//# sourceMappingURL=queries.service.js.map