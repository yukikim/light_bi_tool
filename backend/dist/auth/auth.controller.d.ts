import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: unknown): Promise<{
        data: {
            id: number;
            email: string;
        };
    }>;
    login(body: unknown): Promise<{
        token: string;
    }>;
}
