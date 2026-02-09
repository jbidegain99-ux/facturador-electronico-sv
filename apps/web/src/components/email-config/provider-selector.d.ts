import * as React from 'react';
import { EmailProvider } from '@/types/email-config';
interface ProviderSelectorProps {
    selectedProvider: EmailProvider | null;
    onSelect: (provider: EmailProvider) => void;
    disabled?: boolean;
}
export declare function ProviderSelector({ selectedProvider, onSelect, disabled, }: ProviderSelectorProps): React.JSX.Element;
export declare function ProviderDocsLink({ provider }: {
    provider: EmailProvider;
}): React.JSX.Element | null;
export {};
//# sourceMappingURL=provider-selector.d.ts.map