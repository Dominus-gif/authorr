"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RefreshCw, Square, X, Timer as TimerIcon, Clock } from "lucide-react";
import { useStore } from "@/lib/store";

const PRESETS = [5, 10, 15, 30]; // minutes

function fmt(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Beautiful floating focus timer (Pro/Team). Presets + custom hours/minutes,
 *  with Start / Pause / Resume / Restart / Reset, and a progress ring. */
export function Timer() {
  const open = useStore((s) => s.timerOpen);
  const setOpen = useStore((s) => s.setTimerOpen);
  const showToast = useStore((s) => s.showToast);

  const [duration, setDuration] = useState(15 * 60); // target seconds
  const [remaining, setRemaining] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [ch, setCh] = useState(0);
  const [cm, setCm] = useState(20);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const dragging = useRef(false);

  // Drag by the header. Smooth follow; clamped to the viewport.
  const onDragStart = (e: React.PointerEvent) => {
    const el = (e.currentTarget as HTMLElement).closest("[data-timer]") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const offX = e.clientX - r.left, offY = e.clientY - r.top;
    dragging.current = true;
    const move = (ev: PointerEvent) => {
      setPos({
        left: Math.max(8, Math.min(window.innerWidth - r.width - 8, ev.clientX - offX)),
        top: Math.max(8, Math.min(window.innerHeight - 56, ev.clientY - offY)),
      });
    };
    const up = () => { dragging.current = false; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          showToast("⏰ Time's up — nice focus session.");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, showToast]);

  if (!open) return null;

  const setPreset = (min: number) => { setDuration(min * 60); setRemaining(min * 60); setRunning(false); setShowCustom(false); };
  const applyCustom = () => {
    const total = Math.max(1, ch * 3600 + cm * 60);
    setDuration(total); setRemaining(total); setRunning(false); setShowCustom(false);
  };
  const restart = () => { setRemaining(duration); setRunning(true); };
  const reset = () => { setRemaining(duration); setRunning(false); };
  const finished = remaining === 0;
  const progress = duration > 0 ? 1 - remaining / duration : 0;

  // Progress ring geometry
  const R = 52, C = 2 * Math.PI * R;

  const ctrlBtn = (icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean): React.ReactNode => (
    <button onClick={onClick} title={label} aria-label={label}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: primary ? "none" : "1px solid var(--border-strong)", background: primary ? "var(--accent)" : "var(--bg-elev-2)", color: primary ? "var(--accent-contrast)" : "var(--text-secondary)" }}>
      {icon}
    </button>
  );

  return (
    <div
      data-timer
      style={{ position: "fixed", zIndex: 120, width: 212, background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, boxShadow: "0 18px 48px rgba(0,0,0,0.4)", overflow: "hidden", transition: "box-shadow .2s ease", ...(pos ? { left: pos.left, top: pos.top } : { bottom: 24, right: 22 }) }}
    >
      <div
        onPointerDown={onDragStart}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--border)", cursor: "grab", touchAction: "none", userSelect: "none" }}
      >
        <TimerIcon size={15} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Focus timer</span>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)} aria-label="Close timer" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={16} /></button>
      </div>

      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {/* Progress ring + time */}
        <div style={{ position: "relative", width: 124, height: 124 }}>
          <svg width="124" height="124" viewBox="0 0 124 124">
            <circle cx="62" cy="62" r={R} fill="none" stroke="var(--bg-elev-3)" strokeWidth="8" />
            <circle cx="62" cy="62" r={R} fill="none" stroke={finished ? "var(--success)" : "var(--accent)"} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 62 62)" style={{ transition: "stroke-dashoffset 0.5s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text)", letterSpacing: "-0.02em" }}>
            {fmt(remaining)}
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
          {PRESETS.map((m) => {
            const active = duration === m * 60 && !showCustom;
            return (
              <button key={m} onClick={() => setPreset(m)}
                style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)", color: active ? "var(--accent)" : "var(--text-secondary)" }}>
                {m}m
              </button>
            );
          })}
          <button onClick={() => setShowCustom((v) => !v)} title="Custom time"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: showCustom ? "1px solid var(--accent)" : "1px solid var(--border)", background: showCustom ? "var(--accent-soft)" : "var(--bg-elev-2)", color: showCustom ? "var(--accent)" : "var(--text-secondary)" }}>
            <Clock size={12} /> Custom
          </button>
        </div>

        {showCustom && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
            <NumIn label="h" value={ch} max={12} onChange={setCh} />
            <NumIn label="m" value={cm} max={59} onChange={setCm} />
            <button onClick={applyCustom} style={{ fontSize: 11.5, fontWeight: 600, padding: "7px 12px", borderRadius: 8, background: "var(--accent)", color: "var(--accent-contrast)" }}>Set</button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: 7 }}>
          {!running
            ? ctrlBtn(<Play size={17} />, finished || remaining === duration ? "Start" : "Resume", () => { if (remaining === 0) restart(); else setRunning(true); }, true)
            : ctrlBtn(<Pause size={17} />, "Pause", () => setRunning(false), true)}
          {ctrlBtn(<RefreshCw size={15} />, "Restart", restart)}
          {ctrlBtn(<RotateCcw size={15} />, "Reset", reset)}
          {ctrlBtn(<Square size={14} />, "Stop & close", () => { setRunning(false); setOpen(false); })}
        </div>
      </div>
    </div>
  );
}

function NumIn({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg)" }}>
      <input type="number" min={0} max={max} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, fontVariantNumeric: "tabular-nums" }} />
      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{label}</span>
    </div>
  );
}
