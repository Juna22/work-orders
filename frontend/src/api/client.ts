import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

// No authentication in this test: the "logged in" user is sent as X-User-Id.
// The role provider keeps this in sync with the role selector.
let currentUserId: string | null = null;

export function setApiUserId(id: string | null) {
  currentUserId = id;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

async function request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${CONFIG.apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(currentUserId ? { 'X-User-Id': currentUserId } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // NestJS sends `message` as a string, or a string[] for validation errors.
    const message = data?.message;
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : (message ?? response.statusText),
      response.status
    );
  }

  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body: unknown = {}) => request<T>(path, 'POST', body),
};
