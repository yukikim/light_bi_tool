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
exports.ExecuteController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const execute_service_1 = require("./execute.service");
const executeSchema = zod_1.z.object({
    queryId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    params: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
let ExecuteController = class ExecuteController {
    executeService;
    constructor(executeService) {
        this.executeService = executeService;
    }
    async execute(body) {
        const parsed = executeSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException("リクエスト形式が不正です");
        }
        const input = parsed.data;
        const data = await this.executeService.execute({
            queryId: Number(input.queryId),
            params: input.params ?? {},
        });
        return { data };
    }
};
exports.ExecuteController = ExecuteController;
__decorate([
    (0, common_1.Post)("execute"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecuteController.prototype, "execute", null);
exports.ExecuteController = ExecuteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [execute_service_1.ExecuteService])
], ExecuteController);
//# sourceMappingURL=execute.controller.js.map