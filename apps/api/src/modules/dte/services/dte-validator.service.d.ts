import { TipoDte, DTE } from '@facturador/shared';
export interface ValidationResult {
    valid: boolean;
    errors: Array<{
        path: string;
        message: string;
    }>;
}
export declare class DteValidatorService {
    private schemas;
    validate(dte: DTE): ValidationResult;
    validateNumeroControl(numeroControl: string, tipoDte: TipoDte): boolean;
    validateCodigoGeneracion(codigo: string): boolean;
    validateNIT(nit: string): boolean;
    validateNRC(nrc: string): boolean;
}
//# sourceMappingURL=dte-validator.service.d.ts.map