import * as React from 'react';
export interface FacturoLogoProps {
    variant?: 'full' | 'icon' | 'wordmark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    theme?: 'light' | 'dark' | 'auto';
    showTagline?: boolean;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}
export declare function FacturoIcon({ size, className, theme, }: {
    size?: number;
    className?: string;
    theme?: 'light' | 'dark' | 'auto';
}): React.JSX.Element;
export declare function FacturoWordmark({ size, theme, className, }: {
    size?: number;
    theme?: 'light' | 'dark' | 'auto';
    className?: string;
}): React.JSX.Element;
export declare function FacturoTagline({ size, theme, className, }: {
    size?: number;
    theme?: 'light' | 'dark' | 'auto';
    className?: string;
}): React.JSX.Element;
export declare function FacturoLogo({ variant, size, theme, showTagline, className, iconClassName, textClassName, }: FacturoLogoProps): React.JSX.Element;
export declare function FacturoLogoAnimated({ size, className, }: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}): React.JSX.Element;
export default FacturoLogo;
//# sourceMappingURL=FacturoLogo.d.ts.map