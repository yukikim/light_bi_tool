import { QueriesService } from "./queries.service";
export declare class QueriesController {
    private readonly queries;
    constructor(queries: QueriesService);
    list(): Promise<{
        data: import("./queries.service").QueryDto[];
    }>;
    create(body: unknown): Promise<{
        data: import("./queries.service").QueryDto;
    }>;
    get(idParam: string): Promise<{
        data: import("./queries.service").QueryDto;
    }>;
    update(idParam: string, body: unknown): Promise<{
        data: import("./queries.service").QueryDto;
    }>;
    remove(idParam: string): Promise<{
        data: {
            id: number;
        };
    }>;
}
