import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, HelpCircle, MapPin, Zap } from 'lucide-react';
import type { BuddyLanguage, BuddyReply } from '@/api/types';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { KeyTermChips } from './KeyTermChips';
import { Avatar } from './TypingIndicator';
import { cn } from '@/lib/utils';

interface BuddyReplyCardProps {
  reply: BuddyReply;
  language: BuddyLanguage;
  onCheckQuestion: (q: string) => void;
}

export function BuddyReplyCard({ reply, language, onCheckQuestion }: BuddyReplyCardProps) {
  const [listening, setListening] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const isSocratic = reply.mode === 'socratic';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="flex items-start gap-2.5"
    >
      <Avatar />
      <div className="flex w-full min-w-0 flex-col gap-3">
        <GlassCard className="rounded-2xl rounded-tl-md p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {isSocratic && (
                <Badge className="border-accent/30 bg-accent/15 text-accent">
                  <HelpCircle className="h-3 w-3" /> Socratic
                </Badge>
              )}
              {reply.cached && (
                <Badge className="border-warning/30 bg-warning/15 text-warning">
                  <Zap className="h-3 w-3" /> Cached
                </Badge>
              )}
            </div>
            <ListenControl
              text={reply.explanation}
              language={language}
              listening={listening}
              setListening={setListening}
              activeSentence={activeSentence}
              setActiveSentence={setActiveSentence}
            />
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            <SentenceHighlight
              text={reply.explanation}
              activeIndex={listening ? activeSentence : null}
            />
          </p>

          {reply.outlineSection && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>AZ-900 outline: {reply.outlineSection}</span>
            </div>
          )}
        </GlassCard>

        {!isSocratic && reply.localExample && (
          <GlassCard className="rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-accent">
              <MapPin className="h-3.5 w-3.5" />
              Local example
            </div>
            <p className="text-sm leading-relaxed">{reply.localExample}</p>
          </GlassCard>
        )}

        {!isSocratic && reply.keyTerms.length > 0 && (
          <div className="px-1">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Key terms</div>
            <KeyTermChips terms={reply.keyTerms} />
          </div>
        )}

        {!isSocratic && reply.examTrap && (
          <GlassCard className="rounded-2xl border-warning/30 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Exam trap
            </div>
            <p className="text-sm leading-relaxed">{reply.examTrap}</p>
          </GlassCard>
        )}

        {!isSocratic && reply.checkQuestion && (
          <GlassCard className="rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-primary">
              <HelpCircle className="h-3.5 w-3.5" />
              Check yourself
            </div>
            <p className="text-sm leading-relaxed">{reply.checkQuestion}</p>
            <GlassButton
              size="sm"
              variant="accent"
              className="mt-3"
              onClick={() => onCheckQuestion(reply.checkQuestion!)}
            >
              Try answering this
            </GlassButton>
          </GlassCard>
        )}
      </div>
    </motion.div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  );
}

interface ListenControlProps {
  text: string;
  language: BuddyLanguage;
  listening: boolean;
  setListening: (v: boolean) => void;
  activeSentence: number | null;
  setActiveSentence: (v: number | null) => void;
}

function ListenControl({
  text,
  language,
  listening,
  setListening,
  activeSentence,
  setActiveSentence,
}: ListenControlProps) {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 0.8 | 1.2>(1);
  const [usedFallback, setUsedFallback] = useState(false);
  const sentences = splitSentences(text);

  const stop = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setListening(false);
    setPaused(false);
    setActiveSentence(null);
  };

  const speak = () => {
    if (listening) {
      stop();
      return;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const all = window.speechSynthesis.getVoices();
    const hints = LANG_HINT[language];
    const voice =
      all.find((v) => hints.some((h) => v.lang?.toLowerCase().startsWith(h))) ?? null;
    setUsedFallback(voice === null);

    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      u.rate = speed;
      if (voice) u.voice = voice;
      u.onstart = () => setActiveSentence(i);
      u.onend = () => {
        if (i === sentences.length - 1) {
          setListening(false);
          setPaused(false);
          setActiveSentence(null);
        }
      };
      window.speechSynthesis.speak(u);
    });

    setListening(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (!window.speechSynthesis) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const cycleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.2 : s === 1.2 ? 0.8 : 1));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <GlassButton size="sm" variant="ghost" onClick={speak} className="gap-1.5">
        {listening ? <Zap className="h-3.5 w-3.5" /> : <Volume2Icon />}
        {listening ? 'Stop' : 'Listen'}
      </GlassButton>
      {listening && (
        <GlassButton size="sm" variant="ghost" onClick={togglePause} className="gap-1.5">
          {paused ? <PlayIcon /> : <PauseIcon />}
          {paused ? 'Resume' : 'Pause'}
        </GlassButton>
      )}
      {listening && (
        <button
          type="button"
          onClick={cycleSpeed}
          className="glass rounded-lg px-2 py-1 text-[11px] font-medium transition-all hover:bg-white/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Reading speed"
        >
          {speed}x
        </button>
      )}
      {listening && usedFallback && (
        <span className="text-[11px] text-muted-foreground">
          No voice for this language on your device, reading with a default voice.
        </span>
      )}
    </div>
  );
}

const LANG_HINT: Record<BuddyLanguage, string[]> = {
  en: ['en'],
  ss: ['ss'],
  zu: ['zu'],
  sw: ['sw'],
};

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const parts = cleaned.match(/[^.!?]+[.!?]+|\S+$/g);
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [cleaned];
}

function SentenceHighlight({
  text,
  activeIndex,
}: {
  text: string;
  activeIndex: number | null;
}) {
  if (activeIndex === null) return <span>{text}</span>;
  const sentences = splitSentences(text);
  return (
    <span>
      {sentences.map((s, i) => (
        <span
          key={i}
          className={cn(
            'transition-colors',
            i === activeIndex && 'rounded bg-primary/25 px-0.5 -mx-0.5',
            i !== activeIndex && 'opacity-50',
          )}
        >
          {s}{' '}
        </span>
      ))}
    </span>
  );
}

function Volume2Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="4" width="4" height="16" rx="1" />
      <rect x="6" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
