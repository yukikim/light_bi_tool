"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSqlSafety = checkSqlSafety;
const forbidden = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "create",
    "truncate",
    "grant",
    "revoke",
    "copy",
    "call",
    "do",
];
function checkSqlSafety(sql) {
    const normalized = sql
        .replace(/--.*$/gm, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .trim();
    if (!normalized) {
        return { ok: false, code: "EMPTY_SQL", message: "SQLが空です" };
    }
    if (normalized.includes(";")) {
        return { ok: false, code: "MULTI_STATEMENT", message: "複数ステートメントは許可されません" };
    }
    const head = normalized.slice(0, 50).toLowerCase();
    if (!(head.startsWith("select") || head.startsWith("with"))) {
        return { ok: false, code: "ONLY_SELECT", message: "SELECT文のみ実行可能です" };
    }
    const lowered = normalized.toLowerCase();
    for (const word of forbidden) {
        if (new RegExp(`\\b${word}\\b`, "i").test(lowered)) {
            return { ok: false, code: "FORBIDDEN_KEYWORD", message: `禁止キーワードが含まれています: ${word}` };
        }
    }
    return { ok: true };
}
//# sourceMappingURL=sqlSafety.js.map