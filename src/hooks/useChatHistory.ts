import { useCallback, useEffect, useState } from 'react';
import type { BuddyLanguage, BuddyMode, BuddyReply, ChatTurn } from '@/api/types';

const SESSION_KEY = 'ready900-session-id';
const HISTORY_KEY = 'ready900-chat-history';
const REPLIES_KEY = 'ready900-chat-replies';
const CONV_KEY = 'ready900-conversation-id';
const MODE_KEY = 'ready900-mode';
const LANG_KEY = 'ready900-language';
const MAX_HISTORY = 50;

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function useChatHistory() {
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const [history, setHistory] = useState<ChatTurn[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as ChatTurn[]) : [];
    } catch {
      return [];
    }
  });
  const [replies, setReplies] = useState<BuddyReply[]>(() => {
    try {
      const raw = localStorage.getItem(REPLIES_KEY);
      return raw ? (JSON.parse(raw) as BuddyReply[]) : [];
    } catch {
      return [];
    }
  });
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(CONV_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [mode, setModeState] = useState<BuddyMode>(() => {
    try {
      return (localStorage.getItem(MODE_KEY) as BuddyMode) ?? 'simple';
    } catch {
      return 'simple';
    }
  });
  const [language, setLanguageState] = useState<BuddyLanguage>(() => {
    try {
      return (localStorage.getItem(LANG_KEY) as BuddyLanguage) ?? 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(REPLIES_KEY, JSON.stringify(replies.slice(-MAX_HISTORY)));
    } catch {
      // ignore
    }
  }, [replies]);

  useEffect(() => {
    try {
      if (conversationId) localStorage.setItem(CONV_KEY, conversationId);
      else localStorage.removeItem(CONV_KEY);
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const addTurn = useCallback((turn: ChatTurn) => {
    setHistory((h) => [...h, turn]);
  }, []);

  const addReply = useCallback((reply: BuddyReply) => {
    setReplies((r) => [...r, reply]);
  }, []);

  const setMode = useCallback((m: BuddyMode) => setModeState(m), []);
  const setLanguage = useCallback((l: BuddyLanguage) => setLanguageState(l), []);

  const newChat = useCallback(() => {
    setHistory([]);
    setReplies([]);
    setConversationId(undefined);
  }, []);

  return {
    sessionId,
    history,
    replies,
    conversationId,
    mode,
    language,
    addTurn,
    addReply,
    setReplies,
    setConversationId,
    setMode,
    setLanguage,
    newChat,
  };
}
