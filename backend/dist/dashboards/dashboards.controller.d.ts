import { DashboardsService } from "./dashboards.service";
export declare class DashboardsController {
    private readonly dashboards;
    constructor(dashboards: DashboardsService);
    list(): Promise<{
        data: import("./dashboards.service").DashboardDto[];
    }>;
    create(body: unknown): Promise<{
        data: import("./dashboards.service").DashboardDto;
    }>;
    get(idParam: string): Promise<{
        data: import("./dashboards.service").DashboardDto;
    }>;
}
