"use client";

import { Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Slider } from "./Slider";

/** Modern page-zoom control: −/+ steppers around a smooth fill slider, with a
 *  click-to-reset percentage chip. Replaces the old native range input. */
export function ZoomControl() {
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const clamp = (z: number) => Math.min(2, Math.max(0.5, Math.round(z * 100) / 100));
  const pct = Math.round(zoom * 100);

  const step = (dir: number) => setZoom(clamp(zoom + dir * 0.1));
  const btn = (icon: React.ReactNode, label: string, onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={{ display: "flex", padding: 4, borderRadius: 7, color: "var(--text-secondary)", opacity: disabled ? 0.35 : 1 }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--bg-elev-2)"; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 5px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }}
      title="Page zoom"
    >
      {btn(<Minus size={14} />, "Zoom out", () => step(-1), zoom <= 0.5)}
      <Slider value={pct} min={50} max={200} step={10} width={84} ariaLabel="Page zoom" onChange={(v) => setZoom(v / 100)} />
      {btn(<Plus size={14} />, "Zoom in", () => step(1), zoom >= 2)}
      <button
        onClick={() => setZoom(1)}
        title="Reset zoom to 100%"
        style={{ fontSize: 11.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: pct === 100 ? "var(--text-secondary)" : "var(--accent)", minWidth: 38, textAlign: "center", padding: "2px 4px", borderRadius: 6 }}
      >
        {pct}%
      </button>
    </div>
  );
}
