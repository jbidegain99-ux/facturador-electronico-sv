import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

const SkeletonShimmer = React.forwardRef<HTMLDivElement, SkeletonShimmerProps>(
  ({ className, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('facturo-skeleton', className)}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
SkeletonShimmer.displayName = 'SkeletonShimmer';

export { SkeletonShimmer };
