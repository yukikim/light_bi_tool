"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_service_1 = require("../db/db.service");
let AuthService = class AuthService {
    db;
    jwt;
    constructor(db, jwt) {
        this.db = db;
        this.jwt = jwt;
    }
    async register(email, password) {
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        try {
            const result = await this.db.query(`INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`, [email, passwordHash]);
            return result.rows[0];
        }
        catch (error) {
            if (error?.code === "23505") {
                throw new common_1.ConflictException("このメールアドレスは既に登録されています");
            }
            throw error;
        }
    }
    async login(email, password) {
        const result = await this.db.query(`SELECT id, email, password_hash
       FROM users
       WHERE email = $1`, [email]);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
        }
        const ok = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!ok) {
            throw new common_1.UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
        }
        return this.jwt.sign({ sub: user.id, email: user.email });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map