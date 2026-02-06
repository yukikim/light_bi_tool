import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request } from "express";

function statusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "BAD_REQUEST";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "TOO_MANY_REQUESTS";
    default:
      return status >= 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR";
  }
}

function extractMessage(response: unknown): string | undefined {
  if (typeof response === "string") return response;
  if (!response || typeof response !== "object") return undefined;

  const anyResp = response as any;
  const msg = anyResp.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) {
    const first = msg.find((m) => typeof m === "string" && m.trim().length > 0);
    return first;
  }
  return undefined;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = req?.requestId;
    const method = req?.method;
    const path = (req as any)?.originalUrl ?? req?.url;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = extractMessage(response) ?? exception.message ?? "エラーが発生しました";

      const level = status >= 500 ? "error" : status === 401 ? "info" : "warn";
      // eslint-disable-next-line no-console
      console[level](
        JSON.stringify({
          level,
          msg: "http_exception",
          requestId,
          method,
          path,
          status,
          code: statusToCode(status),
          message,
        }),
      );

      res.status(status).json({ error: { code: statusToCode(status), message } });
      return;
    }

    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        msg: "unhandled_exception",
        requestId,
        method,
        path,
      }),
      exception,
    );

    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました" } });
  }
}
