'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConfetti = useConfetti;
exports.Confetti = Confetti;
const react_1 = require("react");
const canvas_confetti_1 = __importDefault(require("canvas-confetti"));
// Facturo brand colors for confetti
const FACTURO_COLORS = [
    '#8B5CF6', // violet-500
    '#A78BFA', // violet-400
    '#C4B5FD', // violet-300
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EC4899', // pink-500
];
const presetConfigs = {
    celebration: () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;
        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            (0, canvas_confetti_1.default)({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: FACTURO_COLORS,
            });
            (0, canvas_confetti_1.default)({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: FACTURO_COLORS,
            });
        }, 250);
    },
    success: () => {
        (0, canvas_confetti_1.default)({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#8B5CF6', '#A78BFA'],
            zIndex: 1000,
        });
    },
    fireworks: () => {
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 360, ticks: 50, zIndex: 1000 };
        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 100 * (timeLeft / duration);
            (0, canvas_confetti_1.default)({
                ...defaults,
                particleCount,
                origin: { x: Math.random(), y: Math.random() * 0.5 },
                colors: FACTURO_COLORS,
            });
        }, 400);
    },
    snow: () => {
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const frame = () => {
            (0, canvas_confetti_1.default)({
                particleCount: 2,
                startVelocity: 0,
                ticks: 300,
                gravity: 0.3,
                origin: { x: Math.random(), y: 0 },
                colors: ['#FFFFFF', '#E2E8F0', '#CBD5E1'],
                shapes: ['circle'],
                scalar: 0.8,
                zIndex: 1000,
            });
            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    },
};
function useConfetti() {
    const fire = (0, react_1.useCallback)((preset = 'celebration') => {
        presetConfigs[preset]();
    }, []);
    const fireCustom = (0, react_1.useCallback)((options) => {
        (0, canvas_confetti_1.default)({
            colors: FACTURO_COLORS,
            zIndex: 1000,
            ...options,
        });
    }, []);
    return { fire, fireCustom };
}
function Confetti({ trigger = false, preset = 'celebration', onComplete, }) {
    const hasTriggered = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (trigger && !hasTriggered.current) {
            hasTriggered.current = true;
            presetConfigs[preset]();
            // Estimate completion time and call onComplete
            const completionTimes = {
                celebration: 3000,
                success: 1000,
                fireworks: 5000,
                snow: 5000,
            };
            if (onComplete) {
                setTimeout(onComplete, completionTimes[preset]);
            }
        }
    }, [trigger, preset, onComplete]);
    // Reset trigger state when trigger becomes false
    (0, react_1.useEffect)(() => {
        if (!trigger) {
            hasTriggered.current = false;
        }
    }, [trigger]);
    return null;
}
exports.default = Confetti;
