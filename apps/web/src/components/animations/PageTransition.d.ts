interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    mode?: 'fade' | 'slide' | 'scale' | 'slideUp';
}
export declare function PageTransition({ children, className, mode, }: PageTransitionProps): import("react").JSX.Element;
interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}
export declare function FadeIn({ children, delay, duration, className, direction, }: FadeInProps): import("react").JSX.Element;
interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
}
export declare function StaggerContainer({ children, className, staggerDelay, }: StaggerContainerProps): import("react").JSX.Element;
interface StaggerItemProps {
    children: React.ReactNode;
    className?: string;
}
export declare function StaggerItem({ children, className }: StaggerItemProps): import("react").JSX.Element;
export default PageTransition;
//# sourceMappingURL=PageTransition.d.ts.map