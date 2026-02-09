import * as React from 'react';
import type { HaciendaEnvironment, EnvironmentConfigData } from '../types';
interface EnvironmentConfigProps {
    environment: HaciendaEnvironment;
    config: EnvironmentConfigData | null;
    disabled?: boolean;
    disabledMessage?: string;
    onConfigured: () => void;
}
export declare function EnvironmentConfig({ environment, config, disabled, disabledMessage, onConfigured, }: EnvironmentConfigProps): React.JSX.Element;
export {};
//# sourceMappingURL=EnvironmentConfig.d.ts.map