import { CsvService } from "./csv.service";
export declare class CsvController {
    private readonly csv;
    constructor(csv: CsvService);
    upload(file?: Express.Multer.File): Promise<{
        data: {
            schema: string;
            table: string;
            queryId: number;
            dashboardId: number;
            widgetId: number;
        };
    }>;
}
