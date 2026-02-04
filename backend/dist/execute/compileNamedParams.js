"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileNamedParams = compileNamedParams;
const placeholderRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
function compileNamedParams(sql, params) {
    const values = [];
    const indexByName = new Map();
    const compiledSql = sql.replace(placeholderRegex, (_match, name) => {
        if (!indexByName.has(name)) {
            if (!(name in params)) {
                throw new Error(`missing_param:${name}`);
            }
            values.push(params[name]);
            indexByName.set(name, values.length);
        }
        return `$${indexByName.get(name)}`;
    });
    return { sql: compiledSql, values };
}
//# sourceMappingURL=compileNamedParams.js.map