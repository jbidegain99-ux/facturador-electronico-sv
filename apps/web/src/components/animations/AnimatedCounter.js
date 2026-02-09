'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedCounter = AnimatedCounter;
exports.formatNumber = formatNumber;
exports.formatCurrency = formatCurrency;
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const utils_1 = require("@/lib/utils");
function AnimatedCounter({ value, direction = 'up', duration = 2, delay = 0, decimals = 0, prefix = '', suffix = '', className, formatValue, }) {
    const ref = (0, react_1.useRef)(null);
    const motionValue = (0, framer_motion_1.useMotionValue)(direction === 'down' ? value : 0);
    const springValue = (0, framer_motion_1.useSpring)(motionValue, {
        damping: 60,
        stiffness: 100,
        duration: duration * 1000,
    });
    const isInView = (0, framer_motion_1.useInView)(ref, { once: true, margin: '-100px' });
    (0, react_1.useEffect)(() => {
        if (isInView) {
            const timeout = setTimeout(() => {
                motionValue.set(direction === 'down' ? 0 : value);
            }, delay * 1000);
            return () => clearTimeout(timeout);
        }
    }, [isInView, motionValue, direction, value, delay]);
    (0, react_1.useEffect)(() => {
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
    return (<framer_motion_1.motion.span ref={ref} className={(0, utils_1.cn)('tabular-nums', className)} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay }}>
      {prefix}
      {direction === 'down' ? value : 0}
      {suffix}
    </framer_motion_1.motion.span>);
}
// Utility function to format numbers with commas
function formatNumber(num) {
    return num.toLocaleString('en-US');
}
// Utility function to format currency
function formatCurrency(num, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}
exports.default = AnimatedCounter;
