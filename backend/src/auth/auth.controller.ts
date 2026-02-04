import { BadRequestException, Body, Controller, HttpCode, Post } from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "./auth.service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() body: unknown) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("email/password の形式が不正です");
    }
    const input = parsed.data;
    const user = await this.authService.register(input.email, input.password);
    return { data: { id: user.id, email: user.email } };
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("email/password の形式が不正です");
    }
    const input = parsed.data;
    const token = await this.authService.login(input.email, input.password);
    return { token };
  }
}
