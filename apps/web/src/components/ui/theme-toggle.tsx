"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store";

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 64;
const H = 30;
const R = 11;
const CY = H / 2;
const SUN_CX = R + 4;
const MOON_CX = W - R - 4;

const STARS = [
  { x: 36, y: 7, r: 1.1, d: "0ms" },
  { x: 50, y: 11, r: 0.8, d: "250ms" },
  { x: 43, y: 20, r: 0.9, d: "500ms" },
  { x: 57, y: 6, r: 0.7, d: "125ms" },
  { x: 56, y: 19, r: 0.6, d: "375ms" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  const orbCX = isDark ? MOON_CX : SUN_CX;

  const handleToggle = useCallback(() => {
    setTick((t) => t + 1);
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  if (!mounted) {
    return (
      <div
        style={{
          width: W,
          height: H,
          borderRadius: H / 2,
          background: "rgba(124,58,237,0.15)",
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes ct-twinkle {
          0%,100% { opacity: 1;   transform: scale(1);   }
          50%      { opacity: 0.2; transform: scale(0.5); }
        }
        @keyframes ct-ripple {
          from { transform: translate(-50%,-50%) scale(1);   opacity: 0.55; }
          to   { transform: translate(-50%,-50%) scale(2.2); opacity: 0;    }
        }
      `}</style>

      <button
        onClick={handleToggle}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        role="switch"
        aria-checked={isDark}
        style={{
          position: "relative",
          width: W,
          height: H,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          outline: "none",
          display: "block",
          flexShrink: 0,
        }}
      >
        {/* ── Track ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: H / 2,
            overflow: "hidden",
            background: isDark
              ? "linear-gradient(135deg,#111827,#1e1040)"
              : "linear-gradient(135deg,#bae6fd,#e0f2fe)",
            boxShadow: isDark
              ? "0 0 0 1.5px rgba(124,58,237,0.45), 0 2px 14px rgba(124,58,237,0.28)"
              : "0 0 0 1.5px rgba(56,189,248,0.45), 0 2px 14px rgba(56,189,248,0.22)",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}
        >
          {/* Stars */}
          {STARS.map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y,
                width: s.r * 2,
                height: s.r * 2,
                borderRadius: "50%",
                background: "#fff",
                opacity: isDark ? 1 : 0,
                transition: "opacity 0.4s ease",
                animation: "ct-twinkle 2.2s ease-in-out infinite",
                animationDelay: s.d,
              }}
            />
          ))}

          {/* Clouds */}
          {[
            { w: 18, h: 7, top: 8, left: 30 },
            { w: 12, h: 5, top: 18, left: 36 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.left,
                top: c.top,
                width: c.w,
                height: c.h,
                borderRadius: 999,
                background: "rgba(255,255,255,0.88)",
                opacity: isDark ? 0 : 1,
                transform: isDark ? "translateX(-6px)" : "translateX(0)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            />
          ))}
        </div>

        {/* Ripple on click */}
        {tick > 0 && (
          <div
            key={tick}
            style={{
              position: "absolute",
              left: orbCX,
              top: CY,
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              border: `1.5px solid ${
                isDark
                  ? "rgba(139,92,246,0.6)"
                  : "rgba(56,189,248,0.6)"
              }`,
              pointerEvents: "none",
              animation: "ct-ripple 0.55s ease-out forwards",
            }}
          />
        )}

        {/* SVG — orb (sol/luna) + cráteres */}
        <svg
          width={W}
          height={H}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            <radialGradient id="ct-moon-g" cx="38%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ede9ff" />
              <stop offset="45%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#7C3AED" />
            </radialGradient>
            <radialGradient id="ct-sun-g" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fffce8" />
              <stop offset="48%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <filter
              id="ct-glow-moon"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="ct-glow-sun"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orb */}
          <circle
            cx={0}
            cy={CY}
            r={R}
            fill={isDark ? "url(#ct-moon-g)" : "url(#ct-sun-g)"}
            filter={isDark ? "url(#ct-glow-moon)" : "url(#ct-glow-sun)"}
            style={{
              transform: `translateX(${orbCX}px)`,
              transition:
                "transform 0.52s cubic-bezier(0.34,1.56,0.64,1), filter 0.4s ease",
            }}
          />

          {/* Cráteres de la luna */}
          <g
            style={{
              transform: `translateX(${orbCX}px)`,
              transition:
                "transform 0.52s cubic-bezier(0.34,1.56,0.64,1)",
              opacity: isDark ? 1 : 0,
            }}
          >
            <circle cx={3} cy={-4} r={2.0} fill="rgba(109,40,217,0.3)" />
            <circle cx={6} cy={2} r={1.3} fill="rgba(109,40,217,0.22)" />
            <circle cx={0} cy={5} r={1.0} fill="rgba(109,40,217,0.18)" />
          </g>
        </svg>
      </button>
    </>
  );
}
