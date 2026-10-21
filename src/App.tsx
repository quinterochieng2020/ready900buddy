import { useCallback, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';
import { TopBar } from '@/components/TopBar';
import { Footer } from '@/components/Footer';
import { ModeSwitch } from '@/components/ModeSwitch';
import { EmptyState } from '@/components/EmptyState';
import { ChatList } from '@/components/ChatList';
import { ChatInput } from '@/components/ChatInput';
import { useTheme } from '@/hooks/useTheme';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useBuddy } from '@/hooks/useBuddy';
import type { ApiError, BuddyReply, ChatTurn } from '@/api/types';

const MAX_HISTORY_TURNS = 6;

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: false },
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function Ready900Buddy() {
  const { theme, toggleTheme } = useTheme();
  const chat = useChatHistory();
  const buddy = useBuddy();

  const [replies, setReplies] = useState<BuddyReply[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [pendingText, setPendingText] = useState<string | null>(null);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setError(null);

      const userTurn: ChatTurn = { role: 'user', content: text };
      const updatedHistory = [...chat.history, userTurn];
      chat.addTurn(userTurn);
      setPendingText(text);

      const historyForApi = updatedHistory.slice(-MAX_HISTORY_TURNS);

      buddy.mutate(
        {
          req: {
            conversationId: chat.conversationId,
            message: text,
            mode: chat.mode,
            language: chat.language,
            history: historyForApi,
          },
          sessionId: chat.sessionId,
        },
        {
          onSuccess: (reply) => {
            chat.setConversationId(reply.conversationId);
            setReplies((r) => [...r, reply]);
            chat.addTurn({ role: 'assistant', content: reply.explanation });
            setPendingText(null);
            setError(null);
          },
          onError: (err: ApiError) => {
            setPendingText(null);
            setError(err);
            if (err.code === 'RATE_LIMITED' && err.retryAfterSeconds) {
              startCountdown(err.retryAfterSeconds);
            }
          },
        },
      );
    },
    [buddy, chat],
  );

  const retry = useCallback(() => {
    if (pendingText) return;
    const lastUser = [...chat.history].reverse().find((t) => t.role === 'user');
    if (!lastUser) return;
    // History already contains the user turn from the failed send.
    // Send the same message again but without re-adding the user turn.
    setError(null);
    setPendingText(lastUser.content);
    const historyForApi = chat.history.slice(-MAX_HISTORY_TURNS);
    buddy.mutate(
      {
        req: {
          conversationId: chat.conversationId,
          message: lastUser.content,
          mode: chat.mode,
          language: chat.language,
          history: historyForApi,
        },
        sessionId: chat.sessionId,
      },
      {
        onSuccess: (reply) => {
          chat.setConversationId(reply.conversationId);
          setReplies((r) => [...r, reply]);
          chat.addTurn({ role: 'assistant', content: reply.explanation });
          setPendingText(null);
          setError(null);
        },
        onError: (err: ApiError) => {
          setPendingText(null);
          setError(err);
          if (err.code === 'RATE_LIMITED' && err.retryAfterSeconds) {
            startCountdown(err.retryAfterSeconds);
          }
        },
      },
    );
  }, [buddy, chat, pendingText]);

  const handleNewChat = useCallback(() => {
    chat.newChat();
    setReplies([]);
    setError(null);
    setPendingText(null);
    setCountdown(0);
  }, [chat]);

  const handleCheckQuestion = useCallback((q: string) => {
    // put the question in the input by sending it prefilled — simplest: focus input
    // We dispatch a custom event the input can listen for.
    window.dispatchEvent(new CustomEvent('ready900-prefill', { detail: q }));
  }, []);

  const isPending = buddy.isPending;
  const inputDisabled = isPending || countdown > 0;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundOrbs />
      <div className="relative z-10 flex flex-1 flex-col">
        <TopBar
          theme={theme}
          onToggleTheme={toggleTheme}
          language={chat.language}
          onLanguageChange={chat.setLanguage}
          onNewChat={handleNewChat}
        />

        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto max-w-3xl">
            <ModeSwitch value={chat.mode} onChange={chat.setMode} />
          </div>
        </div>

        {chat.history.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
            <EmptyState onSuggestion={send} />
          </div>
        ) : (
          <ChatList
            history={chat.history}
            replies={replies}
            pendingText={pendingText}
            error={error}
            language={chat.language}
            onRetry={retry}
            onCheckQuestion={handleCheckQuestion}
          />
        )}

        <ChatInput
          onSend={send}
          disabled={inputDisabled}
          countdown={countdown}
        />

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Ready900Buddy />
    </QueryClientProvider>
  );
}
