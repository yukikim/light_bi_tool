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
exports.CsvService = void 0;
const common_1 = require("@nestjs/common");
const sync_1 = require("csv-parse/sync");
const db_service_1 = require("../db/db.service");
function quoteIdent(identifier) {
    return `"${identifier.replaceAll('"', '""')}"`;
}
function normalizeIdentifier(input) {
    const trimmed = input.trim().toLowerCase();
    const replaced = trimmed.replace(/[^a-z0-9_]+/g, "_");
    const collapsed = replaced.replace(/_+/g, "_");
    const stripped = collapsed.replace(/^_+|_+$/g, "");
    if (!stripped)
        return "";
    const prefixed = /^[0-9]/.test(stripped) ? `_${stripped}` : stripped;
    return prefixed.slice(0, 50);
}
function toUniqueIdentifiers(candidates) {
    const used = new Map();
    return candidates.map((c, idx) => {
        let base = normalizeIdentifier(c);
        if (!base)
            base = `col_${idx + 1}`;
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        if (count === 0)
            return base;
        return `${base}_${count + 1}`;
    });
}
function isIntegerLike(value) {
    return /^-?\d+$/.test(value);
}
function isNumberLike(value) {
    return /^-?\d+(?:\.\d+)?$/.test(value);
}
function isBooleanLike(value) {
    return /^(true|false)$/i.test(value);
}
function isDateLike(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime());
}
function isTimestampLike(value) {
    if (!/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(value)) {
        return false;
    }
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
}
function inferColumnType(values) {
    const nonEmpty = values.map((v) => v.trim()).filter((v) => v.length > 0);
    if (nonEmpty.length === 0)
        return "text";
    const allInt = nonEmpty.every(isIntegerLike);
    if (allInt)
        return "bigint";
    const allNum = nonEmpty.every(isNumberLike);
    if (allNum)
        return "double precision";
    const allBool = nonEmpty.every(isBooleanLike);
    if (allBool)
        return "boolean";
    const allTs = nonEmpty.every(isTimestampLike);
    if (allTs)
        return "timestamptz";
    const allDate = nonEmpty.every(isDateLike);
    if (allDate)
        return "date";
    return "text";
}
function sanitizeTableBaseName(originalName) {
    const base = originalName.split("/").pop()?.split("\\").pop() ?? originalName;
    const noExt = base.replace(/\.[^.]+$/, "");
    const normalized = normalizeIdentifier(noExt);
    return normalized ? normalized.slice(0, 30) : "csv";
}
let CsvService = class CsvService {
    db;
    constructor(db) {
        this.db = db;
    }
    async importCsv(input) {
        const text = input.content.toString("utf8");
        if (!text.trim()) {
            throw new common_1.BadRequestException("CSVファイルが空です");
        }
        let records;
        try {
            records = (0, sync_1.parse)(text, {
                bom: true,
                relax_quotes: true,
                relax_column_count: true,
                skip_empty_lines: true,
            });
        }
        catch {
            throw new common_1.BadRequestException("CSVの解析に失敗しました");
        }
        if (!Array.isArray(records) || records.length < 2) {
            throw new common_1.BadRequestException("CSVはヘッダ行+1行以上のデータが必要です");
        }
        const rawHeaders = records[0].map((h) => String(h ?? "").trim());
        const headers = toUniqueIdentifiers(rawHeaders);
        const rows = records.slice(1).map((row) => headers.map((_, idx) => String(row?.[idx] ?? "")));
        if (headers.length === 0) {
            throw new common_1.BadRequestException("ヘッダ行が不正です");
        }
        const MAX_ROWS = 50_000;
        if (rows.length > MAX_ROWS) {
            throw new common_1.BadRequestException(`行数が多すぎます（最大 ${MAX_ROWS} 行）`);
        }
        const sampleSize = Math.min(rows.length, 200);
        const columnTypes = headers.map((_, colIdx) => {
            const sample = rows.slice(0, sampleSize).map((r) => r[colIdx] ?? "");
            return inferColumnType(sample);
        });
        const schema = "csv_schema";
        const baseName = sanitizeTableBaseName(input.originalName);
        const table = `${baseName}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
        const qualifiedTable = `${quoteIdent(schema)}.${quoteIdent(table)}`;
        return await this.db.withClient(async (client) => {
            await client.query("BEGIN");
            try {
                await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)};`);
                const columnsSql = headers
                    .map((h, idx) => `${quoteIdent(h)} ${columnTypes[idx] ?? "text"}`)
                    .join(", ");
                await client.query(`CREATE TABLE ${qualifiedTable} (${columnsSql});`);
                const colListSql = headers.map(quoteIdent).join(", ");
                const colCount = headers.length;
                const maxParams = 60000;
                const rowsPerBatch = Math.max(1, Math.min(500, Math.floor(maxParams / colCount)));
                for (let offset = 0; offset < rows.length; offset += rowsPerBatch) {
                    const batch = rows.slice(offset, offset + rowsPerBatch);
                    const values = [];
                    const tuplesSql = [];
                    batch.forEach((row, rowIdx) => {
                        const placeholders = [];
                        for (let c = 0; c < colCount; c++) {
                            values.push(row[c] !== undefined && row[c].trim() !== "" ? row[c] : null);
                            placeholders.push(`$${rowIdx * colCount + c + 1}`);
                        }
                        tuplesSql.push(`(${placeholders.join(", ")})`);
                    });
                    await client.query(`INSERT INTO ${qualifiedTable} (${colListSql}) VALUES ${tuplesSql.join(", ")};`, values);
                }
                const queryName = `CSV: ${input.originalName}`;
                const querySql = `SELECT * FROM ${qualifiedTable}`;
                const queryRes = await client.query("INSERT INTO queries (name, sql, param_defs) VALUES ($1, $2, '[]'::jsonb) RETURNING id", [queryName, querySql]);
                const queryId = Number(queryRes.rows[0]?.id);
                const dashboardRes = await client.query("INSERT INTO dashboards (name) VALUES ($1) RETURNING id", [queryName]);
                const dashboardId = Number(dashboardRes.rows[0]?.id);
                const widgetRes = await client.query("INSERT INTO widgets (dashboard_id, query_id, name, type, config) VALUES ($1, $2, $3, $4, '{}'::jsonb) RETURNING id", [dashboardId, queryId, "CSVテーブル", "table"]);
                const widgetId = Number(widgetRes.rows[0]?.id);
                await client.query("COMMIT");
                return { schema, table, queryId, dashboardId, widgetId };
            }
            catch (e) {
                await client.query("ROLLBACK");
                throw e;
            }
        });
    }
};
exports.CsvService = CsvService;
exports.CsvService = CsvService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], CsvService);
//# sourceMappingURL=csv.service.js.map