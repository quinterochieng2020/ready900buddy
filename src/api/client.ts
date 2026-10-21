import { postBuddyMessage } from './http';
import { mockSendBuddyMessage } from './mock';
import type { BuddyReply, BuddyRequest } from './types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export async function sendBuddyMessage(
  req: BuddyRequest,
  sessionId: string,
): Promise<BuddyReply> {
  if (USE_MOCK) {
    return mockSendBuddyMessage(req);
  }
  return postBuddyMessage(req, sessionId);
}

export type { BuddyReply, BuddyRequest };
