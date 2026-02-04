type CompileResult = {
    sql: string;
    values: unknown[];
};
export declare function compileNamedParams(sql: string, params: Record<string, unknown>): CompileResult;
export {};
