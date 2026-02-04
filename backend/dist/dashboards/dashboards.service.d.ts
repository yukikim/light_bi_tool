import { DbService } from "../db/db.service";
export type DashboardDto = {
    id: number;
    name: string;
    createdAt: string;
};
export declare class DashboardsService {
    private readonly db;
    constructor(db: DbService);
    list(): Promise<DashboardDto[]>;
    getById(id: number): Promise<DashboardDto>;
    create(input: {
        name: string;
    }): Promise<DashboardDto>;
}
