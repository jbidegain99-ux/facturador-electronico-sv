import * as React from 'react';
interface CertificateStepProps {
    certificate: File | null;
    certificatePassword: string;
    onSubmit: (certificate: File, password: string) => void;
    onBack: () => void;
}
export declare function CertificateStep({ certificate: initialCertificate, certificatePassword: initialPassword, onSubmit, onBack, }: CertificateStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=CertificateStep.d.ts.map