"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Moon } from "lucide-react";
import { useStore } from "@/lib/store";
import { Slider } from "./Slider";

/**
 * Eye-comfort controls for the top bar: an interface brightness slider and a
 * warm-light Night Mode toggle. Both apply via a single fixed, pointer-through
 * overlay (portaled to body) — a black veil for dimming + a warm amber multiply
 * tint for night mode — so they work over any theme without filter repaints.
 */
export function ScreenShade() {
  const brightness = useStore((s) => s.brightness);
  const nightMode = useStore((s) => s.nightMode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const dim = Math.min(0.45, Math.max(0, 1 - brightness)); // 0 at 100%, .45 at 55%
  return createPortal(
    <>
      {nightMode && (
        <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 2000, pointerEvents: "none", background: "rgba(255,168,80,0.16)", mixBlendMode: "multiply" }} />
      )}
      {dim > 0 && (
        <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 2001, pointerEvents: "none", background: "#000", opacity: dim, transition: "opacity .12s ease" }} />
      )}
    </>,
    document.body,
  );
}

export function ComfortControls() {
  const brightness = useStore((s) => s.brightness);
  const setBrightness = useStore((s) => s.setBrightness);
  const nightMode = useStore((s) => s.nightMode);
  const setNightMode = useStore((s) => s.setNightMode);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 8px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }} title="Brightness & night light">
      <Sun size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
      <Slider
        value={Math.round(brightness * 100)}
        min={55}
        max={100}
        step={5}
        width={72}
        ariaLabel="Interface brightness"
        accent="#e8a33d"
        onChange={(v) => setBrightness(v / 100)}
      />
      <span style={{ width: 1, height: 18, background: "var(--border)" }} />
      <button
        onClick={() => setNightMode(!nightMode)}
        title={nightMode ? "Night light on — warm, reduced blue light" : "Turn on warm Night Mode"}
        aria-label="Toggle warm night mode"
        aria-pressed={nightMode}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: nightMode ? "#7a5212" : "var(--text-secondary)", background: nightMode ? "rgba(255,168,80,0.22)" : "transparent", border: nightMode ? "1px solid rgba(232,163,61,0.5)" : "1px solid transparent" }}
      >
        <Moon size={13} style={{ fill: nightMode ? "#e8a33d" : "none", color: nightMode ? "#e8a33d" : "currentColor" }} /> Night
      </button>
    </div>
  );
}
