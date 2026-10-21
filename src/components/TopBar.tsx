import { Cloud, Moon, Sun } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { LANGUAGES, type BuddyLanguage } from '@/api/types';
import { cn } from '@/lib/utils';

interface TopBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: BuddyLanguage;
  onLanguageChange: (l: BuddyLanguage) => void;
  onNewChat: () => void;
}

export function TopBar({ theme, onToggleTheme, language, onLanguageChange, onNewChat }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <GlassCard strong className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="accent-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow-md shadow-primary/20">
            <Cloud className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-semibold sm:text-lg">
              Ready<span className="accent-text">900</span> Buddy
            </div>
            <div className="hidden truncate text-[11px] text-muted-foreground sm:block">
              Your AZ-900 study buddy
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelect value={language} onChange={onLanguageChange} />
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            aria-label="Start a new chat"
            title="New chat"
            className="hidden sm:inline-flex"
          >
            <PlusIcon />
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </GlassButton>
        </div>
      </GlassCard>
    </header>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function LanguageSelect({
  value,
  onChange,
}: {
  value: BuddyLanguage;
  onChange: (l: BuddyLanguage) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BuddyLanguage)}
        aria-label="Choose language"
        className={cn(
          'glass h-10 appearance-none rounded-xl pl-3 pr-8 text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'cursor-pointer',
        )}
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value} className="bg-background text-foreground">
            {l.nativeLabel}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
