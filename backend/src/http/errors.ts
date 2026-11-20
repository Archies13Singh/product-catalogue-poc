import type { ErrorRequestHandler, RequestHandler } from 'express';

/** An error with a known HTTP status and a message that is safe to show to the client. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string) {
    super(400, 'INVALID_INPUT', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

/** A service we depend on (product data source, mail server) failed. */
export class UpstreamError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(502, 'UPSTREAM_ERROR', message);
    this.cause = options?.cause;
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Route not found'));
};

// Express recognises an error handler by its four parameters, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    if (err.status >= 500) console.error(err);
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Errors raised by the JSON body parser: malformed JSON or a body over the size limit.
  if (isBodyParserError(err)) {
    res.status(err.status).json({
      error: { code: 'INVALID_INPUT', message: 'The request body could not be read' },
    });
    return;
  }
  // Unknown errors may contain internal details, so the client gets a generic message.
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};

function isBodyParserError(err: unknown): err is { status: number } {
  if (typeof err !== 'object' || err === null) return false;
  const { type, status } = err as { type?: unknown; status?: unknown };
  return (
    typeof type === 'string' && type.startsWith('entity.') && (status === 400 || status === 413)
  );
}
