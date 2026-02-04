type CompileResult = { sql: string; values: unknown[] };

const placeholderRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function compileNamedParams(sql: string, params: Record<string, unknown>): CompileResult {
  const values: unknown[] = [];
  const indexByName = new Map<string, number>();

  const compiledSql = sql.replace(placeholderRegex, (_match, name: string) => {
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
