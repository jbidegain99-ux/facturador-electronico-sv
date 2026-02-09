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
export declare function AnimatedCounter({ value, direction, duration, delay, decimals, prefix, suffix, className, formatValue, }: AnimatedCounterProps): import("react").JSX.Element;
export declare function formatNumber(num: number): string;
export declare function formatCurrency(num: number, currency?: string): string;
export default AnimatedCounter;
//# sourceMappingURL=AnimatedCounter.d.ts.map