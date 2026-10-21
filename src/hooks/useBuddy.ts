import { useMutation } from '@tanstack/react-query';
import { sendBuddyMessage } from '@/api/client';
import type { ApiError, BuddyReply, BuddyRequest } from '@/api/types';

export function useBuddy() {
  return useMutation<BuddyReply, ApiError, { req: BuddyRequest; sessionId: string }>({
    mutationFn: ({ req, sessionId }) => sendBuddyMessage(req, sessionId),
  });
}
