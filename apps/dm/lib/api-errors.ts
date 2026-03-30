import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly expose: boolean;
  readonly retryAfter?: number;

  constructor(params: {
    status: number;
    code: ApiErrorCode;
    message: string;
    expose?: boolean;
    retryAfter?: number;
  }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.expose = params.expose ?? true;
    this.retryAfter = params.retryAfter;
  }
}

export function mapCommonThrownErrors(err: unknown): ApiError | null {
  if (!(err instanceof Error)) return null;
  // Back-compat with existing auth helpers that throw by message.
  if (err.message === "UNAUTHENTICATED")
    return new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  if (err.message === "FORBIDDEN")
    return new ApiError({
      status: 403,
      code: "FORBIDDEN",
      message: "Forbidden",
    });
  return null;
}

export function toErrorResponse(
  err: unknown,
  opts?: { fallbackMessage?: string; fallbackStatus?: number },
) {
  const mapped = mapCommonThrownErrors(err);
  const apiErr =
    err instanceof ApiError
      ? err
      : mapped ??
        new ApiError({
          status: opts?.fallbackStatus ?? 500,
          code: "INTERNAL",
          message: opts?.fallbackMessage ?? "Internal Server Error",
          expose: false,
        });

  const body = apiErr.expose
    ? { error: apiErr.message, code: apiErr.code }
    : { error: opts?.fallbackMessage ?? "Internal Server Error" };

  const headers: Record<string, string> = {};
  if (apiErr.code === "TOO_MANY_REQUESTS" && apiErr.retryAfter) {
    headers["Retry-After"] = String(apiErr.retryAfter);
  }

  return NextResponse.json(body, { status: apiErr.status, headers });
}

