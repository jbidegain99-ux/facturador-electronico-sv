import * as React from 'react';
export interface HaciendaConfigBannerProps {
    variant?: 'prominent' | 'subtle' | 'inline';
    showDismiss?: boolean;
    className?: string;
    onDismiss?: () => void;
}
export declare function HaciendaConfigBanner({ variant, showDismiss, className, onDismiss, }: HaciendaConfigBannerProps): React.JSX.Element | null;
export declare function useHaciendaStatus(): {
    isConfigured: boolean;
    isLoading: boolean;
    demoMode: boolean;
};
export default HaciendaConfigBanner;
//# sourceMappingURL=HaciendaConfigBanner.d.ts.map