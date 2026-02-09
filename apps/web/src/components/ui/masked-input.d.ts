interface MaskedInputProps {
    mask: string;
    value: string;
    onValueChange: (masked: string) => void;
    id?: string;
    name?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
}
export declare function MaskedInput({ mask, value, onValueChange, id, name, required, placeholder, className, }: MaskedInputProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=masked-input.d.ts.map