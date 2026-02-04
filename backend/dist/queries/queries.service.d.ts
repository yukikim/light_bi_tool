import { DbService } from "../db/db.service";
export type QueryParamType = "string" | "number" | "date" | "boolean";
export type QueryParamDef = {
    name: string;
    label?: string;
    type: QueryParamType;
    required?: boolean;
    default?: string | number | boolean;
};
export type QueryDto = {
    id: number;
    name: string;
    sql: string;
    paramDefs: QueryParamDef[];
    createdAt: string;
    updatedAt: string;
};
export declare class QueriesService {
    private readonly db;
    constructor(db: DbService);
    list(): Promise<QueryDto[]>;
    getById(id: number): Promise<QueryDto>;
    create(input: {
        name: string;
        sql: string;
        paramDefs?: QueryParamDef[];
    }): Promise<QueryDto>;
    update(id: number, input: {
        name: string;
        sql: string;
        paramDefs?: QueryParamDef[];
    }): Promise<QueryDto>;
    remove(id: number): Promise<{
        id: number;
    }>;
}
