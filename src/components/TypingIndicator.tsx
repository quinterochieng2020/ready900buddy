import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5"
    >
      <Avatar />
      <GlassCard className="flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-foreground/60"
            style={{
              animation: `bounce-dot 1.2s ${i * 0.18}s infinite ease-in-out`,
            }}
          />
        ))}
      </GlassCard>
    </motion.div>
  );
}

function Avatar() {
  return (
    <div className="accent-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 text-xs font-bold text-white shadow-sm shadow-primary/20">
      R9
    </div>
  );
}

export { Avatar };
