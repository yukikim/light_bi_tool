"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const crypto_1 = require("crypto");
function requestLogger(req, res, next) {
    const startedAt = Date.now();
    const requestId = req.header("x-request-id") || (0, crypto_1.randomUUID)();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        const method = req.method;
        const path = req.originalUrl || req.url;
        const status = res.statusCode;
        const line = {
            level: "info",
            msg: "request",
            requestId,
            method,
            path,
            status,
            durationMs,
        };
        console.log(JSON.stringify(line));
    });
    next();
}
//# sourceMappingURL=request-logger.js.map