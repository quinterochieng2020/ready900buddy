import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KeyTerm } from '@/api/types';
import { cn } from '@/lib/utils';

interface KeyTermChipsProps {
  terms: KeyTerm[];
}

export function KeyTermChips({ terms }: KeyTermChipsProps) {
  const [open, setOpen] = useState<string | null>(null);

  if (terms.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => {
        const isOpen = open === t.term;
        return (
          <div key={t.term} className="relative">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : t.term)}
              onMouseEnter={() => setOpen(t.term)}
              onMouseLeave={() => setOpen(null)}
              className={cn(
                'glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                'hover:-translate-y-0.5 hover:bg-white/10 dark:hover:bg-white/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isOpen && 'bg-white/10 dark:bg-white/10',
              )}
              aria-expanded={isOpen}
            >
              <Info className="h-3 w-3 opacity-60" />
              {t.term}
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="glass-strong absolute left-0 top-full z-20 mt-1.5 w-60 rounded-xl p-3 text-xs shadow-lg"
                >
                  <div className="mb-1 font-semibold">{t.term}</div>
                  <p className="text-muted-foreground">{t.meaning}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
