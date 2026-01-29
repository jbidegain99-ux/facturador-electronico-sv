import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-facturo-violet-500/15 text-facturo-violet-400',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-[var(--facturo-border)]',
        success: 'border-transparent bg-[var(--facturo-success)]/15 text-[var(--facturo-success)]',
        warning: 'border-transparent bg-[var(--facturo-warning)]/15 text-[var(--facturo-warning)]',
        error: 'border-transparent bg-[var(--facturo-error)]/15 text-[var(--facturo-error)]',
        info: 'border-transparent bg-[var(--facturo-info)]/15 text-[var(--facturo-info)]',
        violet: 'border-transparent bg-facturo-violet-500/15 text-facturo-violet-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
