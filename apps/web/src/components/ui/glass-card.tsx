import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--facturo-radius-xl)] border border-[var(--facturo-border-light)] bg-[var(--facturo-bg-card)] backdrop-blur-[var(--facturo-blur-md)] p-6 transition-all duration-300',
          hover && 'hover:border-facturo-violet-500/30 hover:shadow-glow',
          glow && 'shadow-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export { GlassCard };
