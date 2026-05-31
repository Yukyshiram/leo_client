export type LeoClientErrorCode =
  | "MISSING_PRIVATE_KEY"
  | "MISSING_STUDENT_CODE"
  | "MISSING_PASSWORD"
  | "MISSING_SESSION"
  | "MISSING_PROGRAM_ID"
  | "INVALID_CREDENTIALS"
  | "HTTP_ERROR"
  | "NON_JSON_RESPONSE"
  | "LEGACY_EMPTY_RESPONSE"
  | "LEGACY_API_ERROR";

export class LeoClientError extends Error {
  readonly code: LeoClientErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(code: LeoClientErrorCode, message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = "LeoClientError";
    this.code = code;
    this.status = options.status;
    this.cause = options.cause;
  }
}

export function isLeoClientError(error: unknown): error is LeoClientError {
  return error instanceof LeoClientError;
}
