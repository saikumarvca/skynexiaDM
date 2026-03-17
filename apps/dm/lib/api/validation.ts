import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "DUPLICATE_KEY"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export function apiError(
  status: number,
  error: string,
  code: ApiErrorCode = "INTERNAL_ERROR",
  details?: unknown
) {
  return NextResponse.json({ error, code, details }, { status });
}

export async function readJsonBody(request: NextRequest) {
  try {
    const data = await request.json();
    return { ok: true as const, data };
  } catch {
    return { ok: false as const };
  }
}

export function zodIssues(issues: z.ZodIssue[]) {
  return issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export async function parseWithSchema<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return {
      ok: false,
      response: apiError(400, "Invalid JSON body", "INVALID_JSON"),
    };
  }

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError(422, "Validation failed", "VALIDATION_ERROR", {
        issues: zodIssues(parsed.error.issues),
      }),
    };
  }

  return { ok: true, data: parsed.data };
}

