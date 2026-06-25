"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clapperboard, Briefcase, GraduationCap, Coffee, ChevronDown, Check, Lock, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDropdownPos } from "@/lib/useDropdownPos";
import type { WorkMode } from "@/lib/types";
import { planAllows, FREE_WORKMODE } from "@/lib/plans";

export const MODES: { id: WorkMode; label: string; desc: string; icon: LucideIcon; color: string }[] = [
  { id: "scriptwriting", label: "Scriptwriting", desc: "Screenplays & scripts", icon: Clapperboard, color: "#c9954a" },
  { id: "professional", label: "Professional", desc: "Business, copy & tech docs", icon: Briefcase, color: "#3a6ea5" },
  { id: "academic", label: "Academic", desc: "Essays & research papers", icon: GraduationCap, color: "#6b5bd0" },
  { id: "casual", label: "Casual", desc: "Journaling & creative hobbies", icon: Coffee, color: "#3f8a6b" },
];

export function ModeSwitcher() {
  const mode = useStore((s) => s.workMode);
  const setMode = useStore((s) => s.setWorkMode);
  const showToast = useStore((s) => s.showToast);
  const plan = useStore((s) => s.plan);
  const requireFeature = useStore((s) => s.requireFeature);
  const workModesUnlocked = planAllows(plan, "workModes");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pos = useDropdownPos(open, btnRef, 250);
  const current = MODES.find((m) => m.id === mode) ?? MODES[1];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const CurIcon = current.icon;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Workspace mode"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          height: 32,
          padding: "0 10px",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--bg-elev-2)",
          color: "var(--text)",
        }}
      >
        <CurIcon size={15} style={{ color: current.color }} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{current.label}</span>
        <ChevronDown size={13} style={{ color: "var(--text-tertiary)" }} />
      </button>

      {open && pos && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 1000,
            width: 250,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-tertiary)", padding: "6px 8px 4px" }}>
            Workspace mode
          </div>
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            const locked = !workModesUnlocked && m.id !== FREE_WORKMODE;
            return (
              <button
                key={m.id}
                onClick={() => {
                  if (locked) { setOpen(false); requireFeature("workModes"); return; }
                  setMode(m.id);
                  setOpen(false);
                  showToast(`${m.label} mode — tools updated.`);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 9px",
                  borderRadius: 8,
                  textAlign: "left",
                  background: active ? "var(--accent-soft)" : "transparent",
                  border: active ? "1px solid var(--accent)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-elev-3)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-elev-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} style={{ color: m.color }} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{m.desc}</span>
                </span>
                {active && <Check size={15} color="var(--accent)" style={{ flexShrink: 0 }} />}
                {locked && <Lock size={13} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
