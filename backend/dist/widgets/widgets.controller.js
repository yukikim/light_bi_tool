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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetsController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const widgets_service_1 = require("./widgets.service");
const createSchema = zod_1.z.object({
    dashboardId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    queryId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    name: zod_1.z.string().min(1).max(200),
    type: zod_1.z.enum(["table", "line", "bar"]),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const updateSchema = zod_1.z
    .object({
    queryId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    name: zod_1.z.string().min(1).max(200).optional(),
    type: zod_1.z.enum(["table", "line", "bar"]).optional(),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    positionX: zod_1.z.number().int().optional(),
    positionY: zod_1.z.number().int().optional(),
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional(),
})
    .strict();
let WidgetsController = class WidgetsController {
    widgets;
    constructor(widgets) {
        this.widgets = widgets;
    }
    async list(dashboardIdParam) {
        if (!dashboardIdParam) {
            throw new common_1.BadRequestException("dashboardId は必須です");
        }
        const dashboardId = Number(dashboardIdParam);
        if (!Number.isFinite(dashboardId) || dashboardId <= 0) {
            throw new common_1.BadRequestException("dashboardId が不正です");
        }
        const data = await this.widgets.listByDashboardId(dashboardId);
        return { data };
    }
    async create(body) {
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException("body が不正です");
        }
        const dashboardId = Number(parsed.data.dashboardId);
        const queryId = Number(parsed.data.queryId);
        if (!Number.isFinite(dashboardId) || dashboardId <= 0) {
            throw new common_1.BadRequestException("dashboardId が不正です");
        }
        if (!Number.isFinite(queryId) || queryId <= 0) {
            throw new common_1.BadRequestException("queryId が不正です");
        }
        const data = await this.widgets.create({
            dashboardId,
            queryId,
            name: parsed.data.name,
            type: parsed.data.type,
            config: parsed.data.config,
        });
        return { data };
    }
    async update(idParam, body) {
        const id = Number(idParam);
        if (!Number.isFinite(id))
            throw new common_1.BadRequestException("id が不正です");
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException("body が不正です");
        }
        const queryId = parsed.data.queryId !== undefined ? Number(parsed.data.queryId) : undefined;
        if (queryId !== undefined && (!Number.isFinite(queryId) || queryId <= 0)) {
            throw new common_1.BadRequestException("queryId が不正です");
        }
        const data = await this.widgets.update(id, {
            ...(queryId !== undefined ? { queryId } : {}),
            ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
            ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
            ...(parsed.data.config !== undefined ? { config: parsed.data.config } : {}),
            ...(parsed.data.positionX !== undefined ? { positionX: parsed.data.positionX } : {}),
            ...(parsed.data.positionY !== undefined ? { positionY: parsed.data.positionY } : {}),
            ...(parsed.data.width !== undefined ? { width: parsed.data.width } : {}),
            ...(parsed.data.height !== undefined ? { height: parsed.data.height } : {}),
        });
        return { data };
    }
    async remove(idParam) {
        const id = Number(idParam);
        if (!Number.isFinite(id))
            throw new common_1.BadRequestException("id が不正です");
        const data = await this.widgets.remove(id);
        return { data };
    }
};
exports.WidgetsController = WidgetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("dashboardId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WidgetsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WidgetsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WidgetsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WidgetsController.prototype, "remove", null);
exports.WidgetsController = WidgetsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("widgets"),
    __metadata("design:paramtypes", [widgets_service_1.WidgetsService])
], WidgetsController);
//# sourceMappingURL=widgets.controller.js.map