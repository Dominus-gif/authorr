"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Palette, Check, Sun, Moon, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDropdownPos } from "@/lib/useDropdownPos";
import type { ThemeName } from "@/lib/types";
import { FREE_THEMES, planAllows } from "@/lib/plans";

interface ThemeMeta {
  id: ThemeName;
  label: string;
  desc: string;
  swatch: string; // representative surface
  dot: string; // accent dot
}

const LIGHT: ThemeMeta[] = [
  { id: "nordic-fog", label: "Nordic Fog", desc: "Cool architectural slate", swatch: "#f7f8fa", dot: "#4d6a8a" },
  { id: "earth-studio", label: "Earth Studio", desc: "Warm clay & sand", swatch: "#faf6f0", dot: "#9a5d30" },
  { id: "sage-minimal", label: "Sage Minimal", desc: "Biophilic desaturated green", swatch: "#f5f8f3", dot: "#45713f" },
  { id: "corporate-clean", label: "Corporate Clean", desc: "Tranquil blue-gray", swatch: "#f7f9fb", dot: "#3a6ea5" },
  { id: "macos", label: "macOS", desc: "Soft Apple light", swatch: "#f5f5f7", dot: "#0071e3" },
  { id: "light", label: "Light", desc: "Neutral bright", swatch: "#ffffff", dot: "#5b51d8" },
  { id: "paper", label: "Authorr", desc: "Warm paper & orange", swatch: "#ffffff", dot: "#ff6b00" },
  { id: "sepia", label: "Sepia", desc: "Reading parchment", swatch: "#f4ecd8", dot: "#993c1d" },
  { id: "glass-frost", label: "Glass · Frost", desc: "Frosted light", swatch: "#eef3fa", dot: "#3b73d6" },
];

const DARK: ThemeMeta[] = [
  { id: "obsidian-bloom", label: "Obsidian Bloom", desc: "Premium velvet violet", swatch: "#1c1922", dot: "#a98bd6" },
  { id: "deep-marine", label: "Deep Marine", desc: "Oceanic deep navy", swatch: "#14202e", dot: "#5a9bd4" },
  { id: "industrial-slate", label: "Industrial Slate", desc: "Neutral concrete", swatch: "#1e1f22", dot: "#7d93ac" },
  { id: "muted-espresso", label: "Muted Espresso", desc: "Warm charcoal & coffee", swatch: "#201b17", dot: "#c79a6a" },
  { id: "eclipse", label: "Eclipse", desc: "Signature dark", swatch: "#16161a", dot: "#7f77dd" },
  { id: "glass-aurora", label: "Glass · Aurora", desc: "Frosted violet", swatch: "#15131a", dot: "#8b7bff" },
  { id: "glass-mint", label: "Glass · Mint", desc: "Frosted teal", swatch: "#0b1614", dot: "#2bbf91" },
  { id: "glass-sunset", label: "Glass · Sunset", desc: "Frosted amber", swatch: "#1a1014", dot: "#e8784e" },
];

const ALL = [...LIGHT, ...DARK];

export function ThemeMenu() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const plan = useStore((s) => s.plan);
  const requireFeature = useStore((s) => s.requireFeature);
  const premiumThemes = planAllows(plan, "premiumThemes");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pos = useDropdownPos(open, btnRef, 280);
  const current = ALL.find((t) => t.id === theme);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const Row = ({ t }: { t: ThemeMeta }) => {
    const active = theme === t.id;
    const locked = !premiumThemes && !FREE_THEMES.has(t.id);
    return (
      <button
        onClick={() => {
          if (locked) { setOpen(false); requireFeature("premiumThemes"); return; }
          setTheme(t.id);
          setOpen(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "7px 9px",
          borderRadius: 8,
          textAlign: "left",
          background: active ? "var(--accent-soft)" : "transparent",
          border: active ? "1px solid var(--accent)" : "1px solid transparent",
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-elev-3)"; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ position: "relative", width: 26, height: 26, borderRadius: 7, background: t.swatch, border: "1px solid var(--border-strong)", flexShrink: 0 }}>
          <span style={{ position: "absolute", right: 3, bottom: 3, width: 9, height: 9, borderRadius: "50%", background: t.dot, boxShadow: "0 0 0 1.5px " + t.swatch }} />
        </span>
        <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text)" }}>{t.label}</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</span>
        </span>
        {active && <Check size={15} color="var(--accent)" style={{ flexShrink: 0 }} />}
        {locked && <Lock size={13} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />}
      </button>
    );
  };

  const GroupLabel = ({ icon: Icon, text }: { icon: typeof Sun; text: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 8px 5px", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-tertiary)" }}>
      <Icon size={12} /> {text}
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Theme"
        aria-label="Theme"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 30,
          padding: "0 9px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "var(--bg-elev-2)",
          color: "var(--text-secondary)",
        }}
      >
        <Palette size={14} />
        <span style={{ width: 12, height: 12, borderRadius: 4, background: current?.swatch ?? "var(--bg-elev-3)", border: "1px solid var(--border-strong)" }} />
        <span style={{ fontSize: 12, maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current?.label ?? "Theme"}</span>
      </button>

      {open && pos && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 1000,
            width: 280,
            maxHeight: pos.maxHeight,
            overflowY: "auto",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
          }}
        >
          <GroupLabel icon={Sun} text="Light" />
          {LIGHT.map((t) => <Row key={t.id} t={t} />)}
          <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />
          <GroupLabel icon={Moon} text="Dark" />
          {DARK.map((t) => <Row key={t.id} t={t} />)}
        </div>,
        document.body,
      )}
    </div>
  );
}
