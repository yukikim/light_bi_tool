import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WidgetsService, WidgetType } from "./widgets.service";

const createSchema = z.object({
  dashboardId: z.union([z.string(), z.number()]),
  queryId: z.union([z.string(), z.number()]),
  name: z.string().min(1).max(200),
  type: z.enum(["table", "line", "bar"]),
  config: z.record(z.string(), z.unknown()).optional(),
});

const updateSchema = z
  .object({
    queryId: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1).max(200).optional(),
    type: z.enum(["table", "line", "bar"]).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    positionX: z.number().int().optional(),
    positionY: z.number().int().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict();

@UseGuards(JwtAuthGuard)
@Controller("widgets")
export class WidgetsController {
  constructor(private readonly widgets: WidgetsService) {}

  @Get()
  async list(@Query("dashboardId") dashboardIdParam?: string) {
    if (!dashboardIdParam) {
      throw new BadRequestException("dashboardId は必須です");
    }
    const dashboardId = Number(dashboardIdParam);
    if (!Number.isFinite(dashboardId) || dashboardId <= 0) {
      throw new BadRequestException("dashboardId が不正です");
    }
    const data = await this.widgets.listByDashboardId(dashboardId);
    return { data };
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("body が不正です");
    }

    const dashboardId = Number(parsed.data.dashboardId);
    const queryId = Number(parsed.data.queryId);
    if (!Number.isFinite(dashboardId) || dashboardId <= 0) {
      throw new BadRequestException("dashboardId が不正です");
    }
    if (!Number.isFinite(queryId) || queryId <= 0) {
      throw new BadRequestException("queryId が不正です");
    }

    const data = await this.widgets.create({
      dashboardId,
      queryId,
      name: parsed.data.name,
      type: parsed.data.type as WidgetType,
      config: parsed.data.config,
    });
    return { data };
  }

  @Put(":id")
  async update(@Param("id") idParam: string, @Body() body: unknown) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException("id が不正です");

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("body が不正です");
    }

    const queryId = parsed.data.queryId !== undefined ? Number(parsed.data.queryId) : undefined;
    if (queryId !== undefined && (!Number.isFinite(queryId) || queryId <= 0)) {
      throw new BadRequestException("queryId が不正です");
    }

    const data = await this.widgets.update(id, {
      ...(queryId !== undefined ? { queryId } : {}),
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type as WidgetType } : {}),
      ...(parsed.data.config !== undefined ? { config: parsed.data.config } : {}),
      ...(parsed.data.positionX !== undefined ? { positionX: parsed.data.positionX } : {}),
      ...(parsed.data.positionY !== undefined ? { positionY: parsed.data.positionY } : {}),
      ...(parsed.data.width !== undefined ? { width: parsed.data.width } : {}),
      ...(parsed.data.height !== undefined ? { height: parsed.data.height } : {}),
    });

    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException("id が不正です");
    const data = await this.widgets.remove(id);
    return { data };
  }
}
