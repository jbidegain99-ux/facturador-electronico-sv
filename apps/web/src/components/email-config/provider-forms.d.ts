import * as React from 'react';
import { EmailProvider, EmailConfigForm } from '@/types/email-config';
interface ProviderFormProps {
    provider: EmailProvider;
    formData: Partial<EmailConfigForm>;
    onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
    disabled?: boolean;
}
export declare function ProviderForm({ provider, formData, onChange, disabled, }: ProviderFormProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=provider-forms.d.ts.map