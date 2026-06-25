"use client";

import { useRef } from "react";

/** A smooth, modern pointer-drag slider: gradient-fill track + lifting thumb,
 *  keyboard accessible (arrows). Replaces native <input type=range>. */
export function Slider({
  value, min, max, step = 1, width = 96, ariaLabel, accent = "var(--accent)", onChange,
}: {
  value: number; min: number; max: number; step?: number; width?: number;
  ariaLabel: string; accent?: string; onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const raw = min + p * (max - min);
    onChange(clamp(Math.round(raw / step) * step));
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setFromX(e.clientX);
    const move = (ev: PointerEvent) => setFromX(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onDown}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(clamp(value + step)); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(clamp(value - step)); }
        if (e.key === "Home") { e.preventDefault(); onChange(min); }
        if (e.key === "End") { e.preventDefault(); onChange(max); }
      }}
      className="ef-slider"
      style={{ position: "relative", width, height: 20, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, height: 5, borderRadius: 999, background: "var(--bg-elev-3, rgba(128,128,128,0.25))" }} />
      <div style={{ position: "absolute", left: 0, width: `${pct * 100}%`, height: 5, borderRadius: 999, background: accent }} />
      <div
        className="ef-slider-thumb"
        style={{ position: "absolute", left: `${pct * 100}%`, transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "var(--bg-elev)", border: `2px solid ${accent}`, boxShadow: "0 1px 5px rgba(0,0,0,0.32)" }}
      />
    </div>
  );
}
