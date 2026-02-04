import { DbService } from "../db/db.service";
export type WidgetType = "table" | "line" | "bar";
export type WidgetDto = {
    id: number;
    dashboardId: number;
    queryId: number;
    name: string;
    type: WidgetType;
    config: Record<string, unknown>;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    createdAt: string;
    updatedAt: string;
};
export declare class WidgetsService {
    private readonly db;
    constructor(db: DbService);
    listByDashboardId(dashboardId: number): Promise<WidgetDto[]>;
    create(input: {
        dashboardId: number;
        queryId: number;
        name: string;
        type: WidgetType;
        config?: Record<string, unknown>;
    }): Promise<WidgetDto>;
    update(id: number, input: Partial<{
        queryId: number;
        name: string;
        type: WidgetType;
        config: Record<string, unknown>;
        positionX: number;
        positionY: number;
        width: number;
        height: number;
    }>): Promise<WidgetDto>;
    remove(id: number): Promise<{
        id: number;
    }>;
}
