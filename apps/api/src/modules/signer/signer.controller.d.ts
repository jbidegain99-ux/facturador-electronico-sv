import { SignerService } from './signer.service';
export declare class SignTestDto {
    payload: Record<string, unknown>;
}
export declare class VerifySignatureDto {
    jws: string;
}
export declare class LoadCertificateDto {
    password: string;
}
export declare class SignerController {
    private readonly signerService;
    constructor(signerService: SignerService);
    getStatus(): {
        loaded: boolean;
        valid: boolean;
        certificate: null;
    } | {
        loaded: boolean;
        valid: boolean;
        certificate: {
            subject: string;
            issuer: string;
            validFrom: string;
            validTo: string;
            serialNumber: string;
        };
    };
    loadCertificate(file: Express.Multer.File, dto: LoadCertificateDto): Promise<{
        success: boolean;
        message: string;
        certificate: {
            subject: string;
            issuer: string;
            validFrom: string;
            validTo: string;
            serialNumber: string;
        };
    }>;
    signTest(dto: SignTestDto): Promise<{
        success: boolean;
        jws: string;
        jwsParts: {
            header: {
                [key: string]: unknown;
                alg: string;
            };
            payloadPreview: string;
        };
        certificate: {
            subject: string;
            validTo: string;
        };
    }>;
    verifySignature(dto: VerifySignatureDto): Promise<{
        success: boolean;
        valid: boolean;
        payload: unknown;
    }>;
    decodeJWS(dto: VerifySignatureDto): {
        success: boolean;
        header: {
            [key: string]: unknown;
            alg: string;
        };
        payload: unknown;
    };
}
//# sourceMappingURL=signer.controller.d.ts.map