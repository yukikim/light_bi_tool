import { OnModuleDestroy } from "@nestjs/common";
import { PoolClient, QueryResult } from "pg";
export declare class DbService implements OnModuleDestroy {
    private readonly pool;
    constructor();
    onModuleDestroy(): Promise<void>;
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}
