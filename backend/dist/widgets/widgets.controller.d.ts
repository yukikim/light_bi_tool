import { WidgetsService } from "./widgets.service";
export declare class WidgetsController {
    private readonly widgets;
    constructor(widgets: WidgetsService);
    list(dashboardIdParam?: string): Promise<{
        data: import("./widgets.service").WidgetDto[];
    }>;
    create(body: unknown): Promise<{
        data: import("./widgets.service").WidgetDto;
    }>;
    update(idParam: string, body: unknown): Promise<{
        data: import("./widgets.service").WidgetDto;
    }>;
    remove(idParam: string): Promise<{
        data: {
            id: number;
        };
    }>;
}
