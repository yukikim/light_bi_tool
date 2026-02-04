import { ExecuteService } from "./execute.service";
export declare class ExecuteController {
    private readonly executeService;
    constructor(executeService: ExecuteService);
    execute(body: unknown): Promise<{
        data: import("./execute.service").ExecuteResponse;
    }>;
}
