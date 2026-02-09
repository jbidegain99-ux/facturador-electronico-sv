import * as React from 'react';
interface OnboardingWizardProps {
    tenantData?: {
        nombre: string;
        nit: string;
        nrc: string;
        actividadEcon: string;
        direccion?: {
            departamento: string;
            municipio: string;
            complemento: string;
        };
        telefono: string;
        correo: string;
        hasCertificate?: boolean;
    };
    onComplete: () => void;
    onSkip: () => void;
}
export declare function OnboardingWizard({ tenantData, onComplete, onSkip, }: OnboardingWizardProps): React.JSX.Element;
export {};
//# sourceMappingURL=onboarding-wizard.d.ts.map