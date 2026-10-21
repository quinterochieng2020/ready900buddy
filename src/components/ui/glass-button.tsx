import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0',
};

const variants: Record<Variant, string> = {
  default:
    'glass text-foreground hover:bg-white/10 dark:hover:bg-white/10',
  ghost:
    'bg-transparent border border-transparent text-foreground/80 hover:bg-white/5 dark:hover:bg-white/5',
  accent:
    'accent-gradient text-white border border-white/20 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5',
  danger:
    'bg-destructive/90 text-destructive-foreground border border-destructive/40 hover:bg-destructive',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
GlassButton.displayName = 'GlassButton';
