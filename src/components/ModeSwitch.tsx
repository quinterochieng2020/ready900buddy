import { motion } from 'framer-motion';
import { MODES, type BuddyMode } from '@/api/types';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface ModeSwitchProps {
  value: BuddyMode;
  onChange: (m: BuddyMode) => void;
}

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  const active = MODES.find((m) => m.value === value) ?? MODES[0];

  return (
    <div className="flex flex-col gap-2">
      <GlassCard className="flex w-full gap-1 overflow-hidden rounded-2xl p-1.5">
        {MODES.map((m) => {
          const isActive = m.value === value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={cn(
                'relative flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors sm:text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId="mode-pill"
                  className="accent-gradient absolute inset-0 rounded-xl border border-white/20 shadow-md shadow-primary/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          );
        })}
      </GlassCard>
      <p className="px-1 text-xs text-muted-foreground">{active.description}</p>
    </div>
  );
}
