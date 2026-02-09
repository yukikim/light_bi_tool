import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DashboardsService } from "./dashboards.service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

@UseGuards(JwtAuthGuard)
@Controller("dashboards")
export class DashboardsController {
  constructor(private readonly dashboards: DashboardsService) {}

  @Get()
  async list() {
    const data = await this.dashboards.list();
    return { data };
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("name は必須です");
    }
    const data = await this.dashboards.create(parsed.data);
    return { data };
  }

  @Get(":id")
  async get(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException("id が不正です");
    const data = await this.dashboards.getById(id);
    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException("id が不正です");
    const data = await this.dashboards.remove(id);
    return { data };
  }
}
