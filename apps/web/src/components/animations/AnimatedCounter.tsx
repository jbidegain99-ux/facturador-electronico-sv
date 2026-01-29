'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  direction?: 'up' | 'down';
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatValue?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  direction = 'up',
  duration = 2,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  formatValue,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
    duration: duration * 1000,
  });
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        motionValue.set(direction === 'down' ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, motionValue, direction, value, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const formattedValue = formatValue
          ? formatValue(latest)
          : latest.toFixed(decimals);
        ref.current.textContent = `${prefix}${formattedValue}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, decimals, prefix, suffix, formatValue]);

  return (
    <motion.span
      ref={ref}
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay }}
    >
      {prefix}
      {direction === 'down' ? value : 0}
      {suffix}
    </motion.span>
  );
}

// Utility function to format numbers with commas
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Utility function to format currency
export function formatCurrency(num: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default AnimatedCounter;
