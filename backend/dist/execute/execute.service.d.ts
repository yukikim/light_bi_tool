import { DbService } from "../db/db.service";
export type ExecuteResponse = {
    columns: string[];
    rows: Record<string, unknown>[];
};
export declare class ExecuteService {
    private readonly db;
    constructor(db: DbService);
    execute(input: {
        queryId: number;
        params: Record<string, unknown>;
    }): Promise<ExecuteResponse>;
}
