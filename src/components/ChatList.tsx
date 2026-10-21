import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApiError, BuddyLanguage, BuddyReply, ChatTurn } from '@/api/types';
import { UserBubble } from './UserBubble';
import { BuddyReplyCard } from './BuddyReplyCard';
import { TypingIndicator } from './TypingIndicator';
import { ErrorBanner } from './ErrorBanner';

interface ChatListProps {
  history: ChatTurn[];
  /** Replies indexed by assistant-turn count (0-based). */
  replies: BuddyReply[];
  pendingText: string | null;
  error: ApiError | null;
  language: BuddyLanguage;
  onRetry: () => void;
  onCheckQuestion: (q: string) => void;
}

export function ChatList({
  history,
  replies,
  pendingText,
  error,
  language,
  onRetry,
  onCheckQuestion,
}: ChatListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history.length, replies.length, pendingText, error]);

  let assistantCount = -1;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {history.map((turn, i) => {
          if (turn.role === 'user') {
            return <UserBubble key={`u-${i}`} text={turn.content} />;
          }
          assistantCount += 1;
          const reply = replies[assistantCount];
          if (!reply) return null;
          return (
            <BuddyReplyCard
              key={`a-${i}`}
              reply={reply}
              language={language}
              onCheckQuestion={onCheckQuestion}
            />
          );
        })}

        <AnimatePresence>
          {pendingText !== null && !error && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {pendingText === null && error && (
          <ErrorBanner error={error} onRetry={onRetry} />
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
}
