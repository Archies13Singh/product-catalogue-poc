/** A failed API call, with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached. */
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Calls our backend. This is the only place in the frontend that uses `fetch`. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Please try again.');
  }

  if (!response.ok) {
    // The backend sends { error: { code, message } }. Anything else, such as a proxy
    // error page, falls back to a generic message.
    const body: unknown = await response.json().catch(() => null);
    const error = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    throw new ApiError(
      response.status,
      typeof error?.code === 'string' ? error.code : 'UNKNOWN_ERROR',
      typeof error?.message === 'string' ? error.message : 'Something went wrong. Please try again.',
    );
  }
  return (await response.json()) as T;
}
