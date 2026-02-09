import * as React from 'react';
interface CertificateInfo {
    filename: string;
    uploadedAt: string;
    expiresAt?: string;
    isValid: boolean;
    subject?: string;
}
interface CertificadoUploadProps {
    currentCert?: CertificateInfo;
    onUploadSuccess?: () => void;
    className?: string;
}
export declare function CertificadoUpload({ currentCert, onUploadSuccess, className, }: CertificadoUploadProps): React.JSX.Element;
export {};
//# sourceMappingURL=certificado-upload.d.ts.map