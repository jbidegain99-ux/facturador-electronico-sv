'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'success' | 'primary' | 'white';
  className?: string;
  onComplete?: () => void;
}

const SIZES = {
  sm: { container: 40, stroke: 3 },
  md: { container: 60, stroke: 4 },
  lg: { container: 80, stroke: 5 },
  xl: { container: 120, stroke: 6 },
};

const COLORS = {
  success: { circle: '#10B981', check: '#10B981' },
  primary: { circle: '#8B5CF6', check: '#8B5CF6' },
  white: { circle: '#FFFFFF', check: '#FFFFFF' },
};

export function SuccessCheckmark({
  size = 'md',
  color = 'success',
  className,
  onComplete,
}: SuccessCheckmarkProps) {
  const { container, stroke } = SIZES[size];
  const colors = COLORS[color];
  const center = container / 2;
  const radius = center - stroke * 2;

  // Checkmark path points (relative to center)
  const checkStart = { x: center - radius * 0.3, y: center };
  const checkMid = { x: center - radius * 0.05, y: center + radius * 0.25 };
  const checkEnd = { x: center + radius * 0.35, y: center - radius * 0.25 };

  return (
    <div className={cn('relative', className)}>
      <svg
        width={container}
        height={container}
        viewBox={`0 0 ${container} ${container}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.circle}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 0.5, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
          }}
          style={{
            filter: `drop-shadow(0 0 ${stroke * 2}px ${colors.circle}40)`,
          }}
        />

        {/* Checkmark */}
        <motion.path
          d={`M ${checkStart.x} ${checkStart.y} L ${checkMid.x} ${checkMid.y} L ${checkEnd.x} ${checkEnd.y}`}
          stroke={colors.check}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 0.3, ease: 'easeOut', delay: 0.4 },
            opacity: { duration: 0.1, delay: 0.4 },
          }}
          onAnimationComplete={onComplete}
          style={{
            filter: `drop-shadow(0 0 ${stroke * 2}px ${colors.check}40)`,
          }}
        />
      </svg>

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.5,
          ease: 'easeOut',
        }}
        style={{
          background: `radial-gradient(circle, ${colors.circle}20 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

export default SuccessCheckmark;
