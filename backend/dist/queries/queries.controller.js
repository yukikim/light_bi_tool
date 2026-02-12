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
exports.QueriesController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const queries_service_1 = require("./queries.service");
const paramDefSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    label: zod_1.z.string().max(200).optional(),
    type: zod_1.z.enum(["string", "number", "date", "boolean"]),
    required: zod_1.z.boolean().optional(),
    default: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]).optional(),
});
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    sql: zod_1.z.string().min(1),
    paramDefs: zod_1.z.array(paramDefSchema).max(50).optional(),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    sql: zod_1.z.string().min(1),
    paramDefs: zod_1.z.array(paramDefSchema).max(50).optional(),
});
let QueriesController = class QueriesController {
    queries;
    constructor(queries) {
        this.queries = queries;
    }
    async list() {
        const data = await this.queries.list();
        return { data };
    }
    async create(body) {
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException("リクエスト形式が不正です");
        }
        const input = parsed.data;
        const data = await this.queries.create(input);
        return { data };
    }
    async get(idParam) {
        const id = Number(idParam);
        if (!Number.isFinite(id)) {
            throw new common_1.BadRequestException("id が不正です");
        }
        const data = await this.queries.getById(id);
        return { data };
    }
    async update(idParam, body) {
        const id = Number(idParam);
        if (!Number.isFinite(id)) {
            throw new common_1.BadRequestException("id が不正です");
        }
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException("リクエスト形式が不正です");
        }
        const input = parsed.data;
        const data = await this.queries.update(id, input);
        return { data };
    }
    async remove(idParam, force) {
        const id = Number(idParam);
        if (!Number.isFinite(id)) {
            throw new common_1.BadRequestException("id が不正です");
        }
        const forceDelete = force === "1" || force === "true";
        const data = forceDelete
            ? await this.queries.removeWithOptions(id, { force: true })
            : await this.queries.remove(id);
        return { data };
    }
};
exports.QueriesController = QueriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueriesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueriesController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("force")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QueriesController.prototype, "remove", null);
exports.QueriesController = QueriesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("queries"),
    __metadata("design:paramtypes", [queries_service_1.QueriesService])
], QueriesController);
//# sourceMappingURL=queries.controller.js.map