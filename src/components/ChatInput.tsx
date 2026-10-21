import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, SquarePlus } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  countdown?: number;
}

const MAX = 500;

export function ChatInput({ onSend, disabled, countdown }: ChatInputProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setValue(detail);
      requestAnimationFrame(() => ref.current?.focus());
    };
    window.addEventListener('ready900-prefill', handler);
    return () => window.removeEventListener('ready900-prefill', handler);
  }, []);

  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0 && trimmed.length <= MAX;
  const isRateLimited = typeof countdown === 'number' && countdown > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
    requestAnimationFrame(() => ref.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const over = value.length > MAX;

  return (
    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
      <GlassCard strong className="rounded-2xl p-2.5 sm:p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              isRateLimited
                ? `Please wait ${countdown}s…`
                : 'Ask about Azure fundamentals… (Enter to send, Shift+Enter for a new line)'
            }
            disabled={disabled}
            className={cn(
              'max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/70 focus:outline-none',
              'disabled:opacity-60',
            )}
          />
          <motion.div whileTap={{ scale: 0.92 }}>
            <GlassButton
              variant="accent"
              size="icon"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              className="h-11 w-11 shrink-0"
            >
              {value.length > 0 ? <Send className="h-5 w-5" /> : <SquarePlus className="h-5 w-5" />}
            </GlassButton>
          </motion.div>
        </div>
        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            {disabled && !isRateLimited ? 'Thinking…' : '\u00A0'}
          </span>
          <span className={cn('text-[11px]', over ? 'text-destructive' : 'text-muted-foreground')}>
            {value.length}/{MAX}
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
