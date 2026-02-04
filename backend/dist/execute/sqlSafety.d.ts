export type SqlSafetyResult = {
    ok: true;
} | {
    ok: false;
    code: string;
    message: string;
};
export declare function checkSqlSafety(sql: string): SqlSafetyResult;
