// Marca Volante — ícone de volante + wordmark serifado.
import { cn } from '@/lib/utils';

export function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M9.4 12H3.1" />
      <path d="M14.6 12h6.3" />
      <path d="M12 14.6V21" />
    </svg>
  );
}

export function Brand({
  className,
  size = 'md',
  tagline = false,
  onInk = false,
}: {
  className?: string;
  size?: 'md' | 'lg';
  tagline?: boolean;
  /** true quando a marca vive sobre tarja preta (footer) */
  onInk?: boolean;
}) {
  const word = size === 'lg' ? 'text-2xl' : 'text-lg';
  const icon = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <SteeringWheelIcon className={cn(icon, onInk ? 'text-bronze-light' : 'text-primary')} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-medium tracking-[0.14em]',
            onInk ? 'text-ink-foreground' : 'text-foreground',
            word,
          )}
        >
          VOLANTE
        </span>
        {tagline && (
          <span
            className={cn(
              'mt-1.5 text-[0.6rem] font-medium tracking-[0.3em]',
              onInk ? 'text-ink-foreground/60' : 'text-muted-foreground',
            )}
          >
            INTELIGÊNCIA AUTOMOTIVA
          </span>
        )}
      </span>
    </span>
  );
}
