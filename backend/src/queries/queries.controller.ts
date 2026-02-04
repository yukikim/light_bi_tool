import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { QueriesService, QueryParamDef } from "./queries.service";

const paramDefSchema: z.ZodType<QueryParamDef> = z.object({
  name: z.string().min(1).max(100),
  label: z.string().max(200).optional(),
  type: z.enum(["string", "number", "date", "boolean"]),
  required: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  sql: z.string().min(1),
  paramDefs: z.array(paramDefSchema).max(50).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  sql: z.string().min(1),
  paramDefs: z.array(paramDefSchema).max(50).optional(),
});

@UseGuards(JwtAuthGuard)
@Controller("queries")
export class QueriesController {
  constructor(private readonly queries: QueriesService) {}

  @Get()
  async list() {
    const data = await this.queries.list();
    return { data };
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("リクエスト形式が不正です");
    }
    const input = parsed.data;
    const data = await this.queries.create(input);
    return { data };
  }

  @Get(":id")
  async get(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      throw new BadRequestException("id が不正です");
    }
    const data = await this.queries.getById(id);
    return { data };
  }

  @Put(":id")
  async update(@Param("id") idParam: string, @Body() body: unknown) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      throw new BadRequestException("id が不正です");
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("リクエスト形式が不正です");
    }
    const input = parsed.data;
    const data = await this.queries.update(id, input);
    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      throw new BadRequestException("id が不正です");
    }
    const data = await this.queries.remove(id);
    return { data };
  }
}
