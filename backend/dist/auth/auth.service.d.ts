import { JwtService } from "@nestjs/jwt";
import { DbService } from "../db/db.service";
export declare class AuthService {
    private readonly db;
    private readonly jwt;
    constructor(db: DbService, jwt: JwtService);
    register(email: string, password: string): Promise<{
        id: number;
        email: string;
    }>;
    login(email: string, password: string): Promise<string>;
}
