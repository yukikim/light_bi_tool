import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { DbService } from "../db/db.service";

type DbUserRow = {
  id: number;
  email: string;
  password_hash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<{ id: number; email: string }> {
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const result = await this.db.query<{ id: number; email: string }>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`,
        [email, passwordHash],
      );

      return result.rows[0]!;
    } catch (error: any) {
      // unique_violation
      if (error?.code === "23505") {
        throw new ConflictException("このメールアドレスは既に登録されています");
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<string> {
    const result = await this.db.query<DbUserRow>(
      `SELECT id, email, password_hash
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];
    if (!user) {
      throw new UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
    }

    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}
