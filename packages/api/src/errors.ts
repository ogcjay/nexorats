import { z } from 'zod';

/** API error codes */
export enum ApiErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/** Structured API error */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(ApiErrorCode.BAD_REQUEST, message, 400, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(message = 'Not found'): ApiError {
    return new ApiError(ApiErrorCode.NOT_FOUND, message, 404);
  }

  static validation(details: unknown): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Validation failed', 422, details);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/** Create success response */
export function success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, meta };
}

/** Create error response from ApiError */
export function errorResponse(err: ApiError): ApiResponse {
  return { success: false, error: err.toJSON().error };
}

/** Validate request body with Zod schema */
export function validateBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw ApiError.validation(result.error.flatten());
  }
  return result.data;
}

/** Common validation schemas */
export const schemas = {
  guildId: z.object({ guildId: z.string().min(1) }),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  pluginToggle: z.object({
    pluginName: z.string().min(1),
    enabled: z.boolean(),
  }),
  guildSetting: z.object({
    key: z.string().min(1),
    value: z.unknown(),
  }),
};
