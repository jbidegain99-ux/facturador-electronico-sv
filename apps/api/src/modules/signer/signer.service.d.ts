import { OnModuleInit } from '@nestjs/common';
export interface CertificateInfo {
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
}
export interface SignResult {
    jws: string;
    certificateInfo: CertificateInfo;
}
export declare class SignerService implements OnModuleInit {
    private readonly logger;
    private privateKey;
    private certificate;
    private josePrivateKey;
    private josePublicKey;
    onModuleInit(): Promise<void>;
    loadCertificate(p12Path: string, password: string): Promise<CertificateInfo>;
    loadCertificateFromBuffer(p12Buffer: Buffer, password: string): Promise<CertificateInfo>;
    getCertificateInfo(): CertificateInfo;
    isCertificateLoaded(): boolean;
    isCertificateValid(): boolean;
    signDTE<T extends object>(dteJson: T): Promise<string>;
    signDTEWithInfo<T extends object>(dteJson: T): Promise<SignResult>;
    verifySignature(jws: string): Promise<{
        valid: boolean;
        payload: unknown;
    }>;
    verifySignatureWithPublicKey(jws: string, publicKeyPem: string): Promise<{
        valid: boolean;
        payload: unknown;
    }>;
    decodeJWSPayload(jws: string): unknown;
    decodeJWSHeader(jws: string): {
        alg: string;
        [key: string]: unknown;
    };
}
//# sourceMappingURL=signer.service.d.ts.map