import { DteType } from '../types/onboarding.types';
export declare class DteTypeSelectionItemDto {
    dteType: DteType;
    isRequired?: boolean;
}
export declare class SetDteTypesDto {
    dteTypes: DteTypeSelectionItemDto[];
}
export declare class DteTypeStatusDto {
    dteType: DteType;
    name: string;
    description: string;
    isRequired: boolean;
    isSelected: boolean;
    testCompleted: boolean;
    testCompletedAt?: Date;
    testsRequired: number;
    testsCompleted: number;
}
//# sourceMappingURL=dte-selection.dto.d.ts.map