import confetti from 'canvas-confetti';
type ConfettiPreset = 'celebration' | 'success' | 'fireworks' | 'snow';
interface ConfettiProps {
    trigger?: boolean;
    preset?: ConfettiPreset;
    duration?: number;
    colors?: string[];
    onComplete?: () => void;
}
export declare function useConfetti(): {
    fire: (preset?: ConfettiPreset) => void;
    fireCustom: (options: confetti.Options) => void;
};
export declare function Confetti({ trigger, preset, onComplete, }: ConfettiProps): null;
export default Confetti;
//# sourceMappingURL=Confetti.d.ts.map