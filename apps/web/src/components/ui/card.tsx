import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border text-card-foreground transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white/[0.03] dark:bg-white/[0.03] light:bg-white/70 backdrop-blur-xl border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] hover:bg-white/[0.06] hover:border-primary/40',
        glass: 'bg-white/[0.03] backdrop-blur-xl border-white/[0.08] hover:bg-white/[0.06] hover:border-primary/40',
        elevated: 'bg-white/[0.05] backdrop-blur-xl border-white/[0.1] shadow-lg hover:bg-white/[0.08]',
        solid: 'bg-card border-border shadow-sm',
        outline: 'bg-transparent border-border',
        ghost: 'bg-transparent border-transparent',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-lg',
        glow: 'hover:border-primary/30 hover:shadow-glow',
        scale: 'hover:scale-[1.02]',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
