"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/**
 * Framer Motion fade + rise, mirroring the Authorr handoff `Anim.jsx` Reveal:
 * by default fires once when scrolled into view (`whileInView`, margin -70px);
 * pass `immediate` to play on mount for above-the-fold content.
 *
 * Safety (also from the handoff): if reduced-motion is requested OR the document
 * is hidden at mount (background tab / headless capture), we render the visible
 * end-state with no animation — content is never left stuck at opacity:0, since
 * Motion pauses rAF-driven animations while the tab is hidden.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

type Tag = "div" | "span" | "section" | "h1" | "h2" | "h3" | "p" | "li" | "ul" | "figure";

interface RevealProps {
  children: ReactNode;
  /** rise distance in px */
  y?: number;
  delay?: number;
  duration?: number;
  /** animate on mount instead of on scroll-into-view */
  immediate?: boolean;
  tag?: Tag;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, y = 18, delay = 0, duration = 0.55, immediate = false, tag = "div", className, style }: RevealProps) {
  const reduce = useReducedMotion();
  // Start hidden=false so SSR and the first client render match; flip after mount
  // if the tab is actually hidden, so we fall back to the static end-state.
  const [docHidden, setDocHidden] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    setDocHidden(document.hidden);
    const onVis = () => { if (!document.hidden) setDocHidden(false); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Static fallback renders a PLAIN tag (not a motion element) so there's no
  // Motion-managed inline opacity left behind at 0.
  if (reduce || docHidden) {
    const Plain = tag;
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }

  const Comp = motion[tag] as React.ComponentType<HTMLMotionProps<"div">>;
  const motionProps: HTMLMotionProps<"div"> = immediate
    ? { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-70px" } };

  return (
    <Comp {...motionProps} transition={{ duration, delay, ease: EASE }} className={className} style={style}>
      {children}
    </Comp>
  );
}
