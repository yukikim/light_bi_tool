import { BadRequestException, Body, Controller, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExecuteService } from "./execute.service";

const executeSchema = z.object({
  queryId: z.union([z.string(), z.number()]),
  params: z.record(z.string(), z.unknown()).optional(),
});

@UseGuards(JwtAuthGuard)
@Controller()
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) {}

  @Post("execute")
  async execute(@Body() body: unknown) {
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("リクエスト形式が不正です");
    }
    const input = parsed.data;
    const data = await this.executeService.execute({
      queryId: Number(input.queryId),
      params: input.params ?? {},
    });
    return { data };
  }
}
