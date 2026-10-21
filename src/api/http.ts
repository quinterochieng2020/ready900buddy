import type { ApiError, ApiErrorCode, BuddyReply, BuddyRequest } from './types';

function parseApiError(status: number, body: unknown): ApiError {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object'
  ) {
    const err = body.error as Record<string, unknown>;
    const code = (err.code as ApiErrorCode) ?? 'PROVIDER_ERROR';
    const message =
      typeof err.message === 'string' ? err.message : 'Something went wrong.';
    const retryAfterSeconds =
      typeof err.retryAfterSeconds === 'number' ? err.retryAfterSeconds : undefined;
    return { code, message, retryAfterSeconds };
  }
  if (status === 429) {
    return { code: 'RATE_LIMITED', message: 'Slow down a little and try again shortly.' };
  }
  if (status >= 500) {
    return { code: 'PROVIDER_ERROR', message: 'The buddy had a problem. Please try again.' };
  }
  if (status >= 400) {
    return { code: 'BAD_REQUEST', message: 'That request could not be understood.' };
  }
  return { code: 'PROVIDER_ERROR', message: 'Something went wrong on our end.' };
}

export async function postBuddyMessage(
  req: BuddyRequest,
  sessionId: string,
): Promise<BuddyReply> {
  const baseUrl = import.meta.env.VITE_API_URL ?? '';
  const url = `${baseUrl.replace(/\/$/, '')}/api/buddy/messages`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(req),
    });
  } catch {
    throw {
      code: 'PROVIDER_ERROR' as const,
      message: 'Could not reach the study buddy. Check your connection and try again.',
    } satisfies ApiError;
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    throw parseApiError(res.status, body);
  }

  return body as BuddyReply;
}
