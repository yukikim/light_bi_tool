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
exports.CsvController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const csv_service_1 = require("./csv.service");
let CsvController = class CsvController {
    csv;
    constructor(csv) {
        this.csv = csv;
    }
    async upload(file) {
        if (!file) {
            throw new common_1.BadRequestException("file は必須です");
        }
        try {
            const data = await this.csv.importCsv({
                originalName: file.originalname,
                content: file.buffer,
            });
            return { data };
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            if (e instanceof common_1.InternalServerErrorException)
                throw e;
            throw new common_1.InternalServerErrorException(e instanceof Error ? e.message : "CSVアップロードでエラーが発生しました");
        }
    }
};
exports.CsvController = CsvController;
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CsvController.prototype, "upload", null);
exports.CsvController = CsvController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("csv"),
    __metadata("design:paramtypes", [csv_service_1.CsvService])
], CsvController);
//# sourceMappingURL=csv.controller.js.map