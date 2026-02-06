import { DbService } from "../db/db.service";
export declare class CsvService {
    private readonly db;
    constructor(db: DbService);
    importCsv(input: {
        originalName: string;
        content: Buffer;
    }): Promise<{
        schema: string;
        table: string;
        queryId: number;
        dashboardId: number;
        widgetId: number;
    }>;
}
