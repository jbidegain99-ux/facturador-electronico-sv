'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageTransition = PageTransition;
exports.FadeIn = FadeIn;
exports.StaggerContainer = StaggerContainer;
exports.StaggerItem = StaggerItem;
const framer_motion_1 = require("framer-motion");
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const variants = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slide: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    },
    scale: {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
    },
    slideUp: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    },
};
function PageTransition({ children, className, mode = 'fade', }) {
    const pathname = (0, navigation_1.usePathname)();
    const variant = variants[mode];
    return (<framer_motion_1.AnimatePresence mode="wait">
      <framer_motion_1.motion.div key={pathname} initial={variant.initial} animate={variant.animate} exit={variant.exit} transition={{
            duration: 0.2,
            ease: 'easeOut',
        }} className={(0, utils_1.cn)('w-full', className)}>
        {children}
      </framer_motion_1.motion.div>
    </framer_motion_1.AnimatePresence>);
}
function FadeIn({ children, delay = 0, duration = 0.3, className, direction = 'up', }) {
    const directionOffset = {
        up: { y: 10 },
        down: { y: -10 },
        left: { x: 10 },
        right: { x: -10 },
        none: {},
    };
    return (<framer_motion_1.motion.div initial={{ opacity: 0, ...directionOffset[direction] }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{
            duration,
            delay,
            ease: 'easeOut',
        }} className={className}>
      {children}
    </framer_motion_1.motion.div>);
}
function StaggerContainer({ children, className, staggerDelay = 0.1, }) {
    return (<framer_motion_1.motion.div initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: staggerDelay,
                },
            },
        }} className={className}>
      {children}
    </framer_motion_1.motion.div>);
}
function StaggerItem({ children, className }) {
    return (<framer_motion_1.motion.div variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
        }} transition={{ duration: 0.3, ease: 'easeOut' }} className={className}>
      {children}
    </framer_motion_1.motion.div>);
}
exports.default = PageTransition;
