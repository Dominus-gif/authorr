"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Fade + rise entrance, mirroring the Authorr handoff Reveal — but implemented
 * with a pure CSS animation instead of JS/Framer Motion.
 *
 * WHY: the Motion version rendered `opacity:0` into the SSR HTML and relied on
 * JS to animate it to 1. On some mobile browsers that animation never ran, so
 * the whole page stayed invisible. A CSS keyframe always runs (no JS needed) and
 * ends at opacity:1, so content can never get stuck hidden. `prefers-reduced-
 * motion` disables the animation (content shows immediately).
 *
 * `immediate` / `whileInView` are kept for API compatibility; both now simply
 * play on mount (a hair earlier for below-the-fold, but always visible).
 */

type Tag = "div" | "span" | "section" | "h1" | "h2" | "h3" | "p" | "li" | "ul" | "figure";

interface RevealProps {
  children: ReactNode;
  /** rise distance in px */
  y?: number;
  delay?: number;
  duration?: number;
  /** kept for API compatibility (no behavioural difference now) */
  immediate?: boolean;
  tag?: Tag;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, y = 18, delay = 0, duration = 0.55, tag = "div", className, style }: RevealProps) {
  const Tag = tag as keyof React.JSX.IntrinsicElements;
  return (
    <Tag
      className={`ef-reveal${className ? " " + className : ""}`}
      style={{ ...style, ["--rv-y" as string]: `${y}px`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
    >
      {children}
    </Tag>
  );
}
