export declare enum CertificateUploadMode {
    COMBINED = "combined",
    SEPARATE = "separate"
}
export declare class UploadTestCertificateDto {
    certificate: string;
    password?: string;
    expiryDate?: string;
    privateKey?: string;
    uploadMode?: CertificateUploadMode;
}
export declare class UploadProdCertificateDto {
    certificate: string;
    password?: string;
    expiryDate?: string;
    privateKey?: string;
    uploadMode?: CertificateUploadMode;
}
export declare class SetApiCredentialsDto {
    apiPassword: string;
    environmentUrl?: string;
}
//# sourceMappingURL=certificate.dto.d.ts.map