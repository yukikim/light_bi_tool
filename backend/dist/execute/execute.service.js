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
exports.ExecuteService = void 0;
const common_1 = require("@nestjs/common");
const env_1 = require("../config/env");
const db_service_1 = require("../db/db.service");
const compileNamedParams_1 = require("./compileNamedParams");
const sqlSafety_1 = require("./sqlSafety");
let ExecuteService = class ExecuteService {
    db;
    constructor(db) {
        this.db = db;
    }
    async execute(input) {
        if (!Number.isFinite(input.queryId)) {
            throw new common_1.BadRequestException("queryId が不正です");
        }
        const queryResult = await this.db.query(`SELECT id, sql
       FROM queries
       WHERE id = $1`, [input.queryId]);
        const queryRow = queryResult.rows[0];
        if (!queryRow)
            throw new common_1.NotFoundException("クエリが見つかりません");
        let sql = String(queryRow.sql ?? "").trim();
        if (sql.endsWith(";"))
            sql = sql.slice(0, -1);
        const safety = (0, sqlSafety_1.checkSqlSafety)(sql);
        if (!safety.ok) {
            throw new common_1.BadRequestException(safety.message);
        }
        const env = (0, env_1.getEnv)();
        const maxRows = env.MAX_RESULT_ROWS;
        const timeoutMs = env.EXECUTE_TIMEOUT_MS;
        let compiled;
        try {
            compiled = (0, compileNamedParams_1.compileNamedParams)(sql, input.params);
        }
        catch (e) {
            const msg = String(e?.message ?? "");
            if (msg.startsWith("missing_param:")) {
                throw new common_1.BadRequestException(`必須パラメータが不足しています: ${msg.replace("missing_param:", "")}`);
            }
            throw e;
        }
        const wrappedSql = `SELECT * FROM (\n${compiled.sql}\n) AS __q LIMIT $${compiled.values.length + 1}`;
        const values = [...compiled.values, maxRows];
        const startedAt = Date.now();
        try {
            const result = await this.db.withClient(async (client) => {
                await client.query("BEGIN");
                await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);
                const r = await client.query(wrappedSql, values);
                await client.query("COMMIT");
                return r;
            });
            const durationMs = Date.now() - startedAt;
            const columns = result.fields.map((f) => f.name);
            const rows = result.rows;
            await this.db.query(`INSERT INTO query_executions (query_id, duration_ms, row_count, params)
         VALUES ($1, $2, $3, $4::jsonb)`, [input.queryId, durationMs, rows.length, JSON.stringify(input.params)]);
            return { columns, rows };
        }
        catch (error) {
            const durationMs = Date.now() - startedAt;
            const message = String(error?.message ?? "execute error");
            const code = String(error?.code ?? "UNKNOWN");
            await this.db
                .query(`INSERT INTO query_executions (query_id, duration_ms, row_count, params, error_code, error_message)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)`, [input.queryId, durationMs, 0, JSON.stringify(input.params), code, message.slice(0, 2000)])
                .catch(() => undefined);
            throw new common_1.BadRequestException("SQL実行に失敗しました");
        }
    }
};
exports.ExecuteService = ExecuteService;
exports.ExecuteService = ExecuteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], ExecuteService);
//# sourceMappingURL=execute.service.js.map