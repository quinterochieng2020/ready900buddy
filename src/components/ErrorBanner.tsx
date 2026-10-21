import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCw, Sparkles } from 'lucide-react';
import type { ApiError } from '@/api/types';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Avatar } from './TypingIndicator';

interface ErrorBannerProps {
  error: ApiError;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  if (error.code === 'OFF_TOPIC') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2.5"
      >
        <Avatar />
        <GlassCard className="max-w-[85%] rounded-2xl rounded-tl-md p-4 sm:max-w-[75%]">
          <p className="text-sm leading-relaxed">
            <Sparkles className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-accent" />
            {error.message}
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  if (error.code === 'DAILY_LIMIT') {
    return (
      <Banner tone="warning" icon={<Clock className="h-4 w-4" />}>
        The buddy has hit its daily limit. Please come back tomorrow.
      </Banner>
    );
  }

  if (error.code === 'RATE_LIMITED') {
    return <RateLimitBanner retryAfterSeconds={error.retryAfterSeconds} message={error.message} />;
  }

  return (
    <Banner tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{error.message}</span>
        <GlassButton size="sm" variant="accent" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </GlassButton>
      </div>
    </Banner>
  );
}

function RateLimitBanner({
  retryAfterSeconds,
  message,
}: {
  retryAfterSeconds?: number;
  message: string;
}) {
  const [remaining, setRemaining] = useState(retryAfterSeconds ?? 0);

  useEffect(() => {
    setRemaining(retryAfterSeconds ?? 0);
    if (!retryAfterSeconds) return;
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfterSeconds]);

  return (
    <Banner tone="warning" icon={<Clock className="h-4 w-4" />}>
      {remaining > 0
        ? `Slow down a little, try again in ${remaining} second${remaining === 1 ? '' : 's'}.`
        : message}
    </Banner>
  );
}

function Banner({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: 'warning' | 'danger';
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard
        className={
          tone === 'warning'
            ? 'flex items-start gap-2.5 rounded-2xl border-warning/40 p-4 text-sm'
            : 'flex items-start gap-2.5 rounded-2xl border-destructive/40 p-4 text-sm'
        }
      >
        <span
          className={
            tone === 'warning' ? 'mt-0.5 text-warning' : 'mt-0.5 text-destructive'
          }
        >
          {icon}
        </span>
        <div className="flex-1">{children}</div>
      </GlassCard>
    </motion.div>
  );
}
