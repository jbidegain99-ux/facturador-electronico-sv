import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border text-card-foreground transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-card border-border shadow-sm border-l-2 border-l-primary/50 hover:shadow-md hover:border-primary/60 dark:bg-[rgba(30,30,45,0.6)] dark:backdrop-blur-md dark:border-white/[0.1] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] dark:hover:bg-[rgba(40,40,60,0.7)] dark:hover:border-primary/60 dark:hover:shadow-[0_8px_32px_rgba(139,92,246,0.25)]',
        glass: 'bg-card border-border shadow-sm border-l-2 border-l-primary/40 hover:shadow-md hover:border-primary/50 dark:bg-[rgba(30,30,45,0.5)] dark:backdrop-blur-xl dark:border-white/[0.12] dark:hover:bg-[rgba(40,40,60,0.6)] dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
        elevated: 'bg-card border-border shadow-md border-l-2 border-l-primary/60 hover:shadow-lg dark:bg-[rgba(35,35,55,0.7)] dark:backdrop-blur-xl dark:border-white/[0.15] dark:shadow-lg dark:hover:bg-[rgba(45,45,65,0.8)] dark:hover:shadow-[0_12px_40px_rgba(139,92,246,0.3)]',
        solid: 'bg-card border-border shadow-sm border-l-2 border-l-primary/30',
        outline: 'bg-transparent border-border border-l-2 border-l-primary/20',
        ghost: 'bg-transparent border-transparent',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,92,246,0.3)]',
        glow: 'hover:border-primary/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]',
        scale: 'hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'glow',
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
