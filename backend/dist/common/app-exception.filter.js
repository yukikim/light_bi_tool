"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
function statusToCode(status) {
    switch (status) {
        case common_1.HttpStatus.BAD_REQUEST:
            return "BAD_REQUEST";
        case common_1.HttpStatus.UNAUTHORIZED:
            return "UNAUTHORIZED";
        case common_1.HttpStatus.FORBIDDEN:
            return "FORBIDDEN";
        case common_1.HttpStatus.NOT_FOUND:
            return "NOT_FOUND";
        case common_1.HttpStatus.CONFLICT:
            return "CONFLICT";
        case common_1.HttpStatus.TOO_MANY_REQUESTS:
            return "TOO_MANY_REQUESTS";
        default:
            return status >= 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR";
    }
}
function extractMessage(response) {
    if (typeof response === "string")
        return response;
    if (!response || typeof response !== "object")
        return undefined;
    const anyResp = response;
    const msg = anyResp.message;
    if (typeof msg === "string")
        return msg;
    if (Array.isArray(msg)) {
        const first = msg.find((m) => typeof m === "string" && m.trim().length > 0);
        return first;
    }
    return undefined;
}
let AppExceptionFilter = class AppExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const requestId = req?.requestId;
        const method = req?.method;
        const path = req?.originalUrl ?? req?.url;
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            const message = extractMessage(response) ?? exception.message ?? "エラーが発生しました";
            const level = status >= 500 ? "error" : status === 401 ? "info" : "warn";
            console[level](JSON.stringify({
                level,
                msg: "http_exception",
                requestId,
                method,
                path,
                status,
                code: statusToCode(status),
                message,
            }));
            res.status(status).json({ error: { code: statusToCode(status), message } });
            return;
        }
        console.error(JSON.stringify({
            level: "error",
            msg: "unhandled_exception",
            requestId,
            method,
            path,
        }), exception);
        res
            .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました" } });
    }
};
exports.AppExceptionFilter = AppExceptionFilter;
exports.AppExceptionFilter = AppExceptionFilter = __decorate([
    (0, common_1.Catch)()
], AppExceptionFilter);
//# sourceMappingURL=app-exception.filter.js.map