import * as React from 'react';
import { EmailConfig, ConnectionTestResult } from '@/types/email-config';
interface ConnectionStatusProps {
    config: EmailConfig | null;
    onTestConnection: () => Promise<ConnectionTestResult>;
    onSendTest: (email: string) => Promise<void>;
    loading?: boolean;
}
export declare function ConnectionStatus({ config, onTestConnection, onSendTest, loading, }: ConnectionStatusProps): React.JSX.Element;
export declare function StatusBadge({ config }: {
    config: EmailConfig | null;
}): React.JSX.Element;
export {};
//# sourceMappingURL=connection-status.d.ts.map