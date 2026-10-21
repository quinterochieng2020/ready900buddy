import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { SUGGESTIONS } from '@/api/types';

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mt-6 max-w-2xl px-1"
    >
      <GlassCard strong className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="accent-gradient mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 shadow-lg shadow-primary/20">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-balance text-xl font-semibold sm:text-2xl">
            Meet your <span className="accent-text">AZ-900</span> study buddy
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Ask me anything about Azure fundamentals. I'll explain in plain words, give you a
            real-life example, flag exam traps, and check your understanding. Pick a mode and a
            language above, then start with one of these:
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                onClick={() => onSuggestion(s)}
                className="glass rounded-full px-3.5 py-2 text-xs font-medium transition-all hover:-translate-y-0.5 hover:bg-white/10 dark:hover:bg-white/10 sm:text-sm"
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
