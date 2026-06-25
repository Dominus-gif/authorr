"use client";

import { useState } from "react";
import { LayoutPanelTop, ChevronDown, Infinity as InfinityIcon, SeparatorHorizontal, FileText, Lock, Grid3x3, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import type { PaperTexture } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import { PAGE_SIZE_ORDER, PAGE_SIZES } from "@/lib/pageSizes";
import { planAllows, type Feature } from "@/lib/plans";

/** Compact labelled range slider used by the grid + margin controls. */
function Slider({ label, value, min, max, suffix, onChange, disabled }: {
  label: string; value: number; min: number; max: number; suffix?: string;
  onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{value}{suffix}</span>
      </div>
      <input className="pro-range" type="range" min={min} max={max} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }} />
    </div>
  );
}

/** Paper textures with a CSS preview for the swatch. */
const PAPER_TEXTURES: { id: PaperTexture; label: string; image: string; size?: string }[] = [
  { id: "plain", label: "Plain", image: "none" },
  { id: "lines", label: "Lines", image: "repeating-linear-gradient(to bottom, transparent 0, transparent 5px, var(--text-tertiary) 5px, var(--text-tertiary) 6px)" },
  { id: "dots", label: "Dots", image: "radial-gradient(var(--text-tertiary) 1px, transparent 1.4px)", size: "7px 7px" },
  { id: "grid", label: "Graph", image: "linear-gradient(to right, var(--text-tertiary) 1px, transparent 1px), linear-gradient(to bottom, var(--text-tertiary) 1px, transparent 1px)", size: "7px 7px" },
];

/** Left-panel page/layout controls: page size, infinite canvas, page break,
 *  and quick access to templates. Expanded by default on each load. */
export function LayoutControls() {
  const infiniteCanvas = useStore((s) => s.infiniteCanvas);
  const setInfiniteCanvas = useStore((s) => s.setInfiniteCanvas);
  const pageSize = useStore((s) => s.pageSize);
  const setPageSize = useStore((s) => s.setPageSize);
  const showToast = useStore((s) => s.showToast);
  const activeDocId = useStore((s) => s.activeDocId);
  const paperTextures = useStore((s) => s.paperTextures);
  const setPaperTexture = useStore((s) => s.setPaperTexture);
  const currentTexture: PaperTexture = (activeDocId && paperTextures[activeDocId]) || "plain";
  const plan = useStore((s) => s.plan);
  const requireFeature = useStore((s) => s.requireFeature);
  const grid = useStore((s) => s.grid);
  const setGrid = useStore((s) => s.setGrid);
  const pageMargin = useStore((s) => s.pageMargin);
  const setPageMargin = useStore((s) => s.setPageMargin);
  const layoutUnlocked = planAllows(plan, "pageLayout");
  const textureUnlocked = planAllows(plan, "paperTexture");
  const gridUnlocked = planAllows(plan, "advancedGrid");
  /** Run `fn` only if the plan allows `feature`, else open the upgrade modal. */
  const gated = (feature: Feature, fn: () => void) => () => { if (requireFeature(feature)) fn(); };
  const editor = useEditorInstance();
  // Expanded by default (component state → resets to open on every refresh).
  const [open, setOpen] = useState(true);

  // Page & layout is a premium surface — hidden entirely on Free.
  if (plan === "free") return null;

  const insertPageBreak = () => {
    if (!requireFeature("pageLayout")) return;
    if (!editor) return;
    editor.chain().focus().insertContent('<hr data-page-break="true">').run();
    showToast("Page break inserted.");
  };

  const usSizes = PAGE_SIZE_ORDER.filter((id) => PAGE_SIZES[id].group === "US");
  const isoSizes = PAGE_SIZE_ORDER.filter((id) => PAGE_SIZES[id].group === "ISO");

  const sizeRow = (id: typeof PAGE_SIZE_ORDER[number]) => {
    const ps = PAGE_SIZES[id];
    const active = pageSize === id;
    return (
      <button
        key={id}
        onClick={gated("pageLayout", () => setPageSize(id))}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 8, textAlign: "left", border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)" }}
      >
        <FileText size={13} style={{ color: active ? "var(--accent)" : "var(--text-tertiary)", flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: "var(--text)", flex: 1 }}>{ps.label}</span>
        {!layoutUnlocked ? <Lock size={11} style={{ color: "var(--text-tertiary)" }} /> : <span style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{ps.dim}</span>}
      </button>
    );
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "8px 10px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "4px 4px", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}
      >
        <LayoutPanelTop size={13} /> Page & layout
        <ChevronDown size={13} style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{ marginTop: 8, maxHeight: 360, overflowY: "auto" }}>
          <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>US / Imperial</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10, opacity: infiniteCanvas ? 0.45 : 1, pointerEvents: infiniteCanvas ? "none" : "auto" }}>
            {usSizes.map(sizeRow)}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>ISO (A / B series)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10, opacity: infiniteCanvas ? 0.45 : 1, pointerEvents: infiniteCanvas ? "none" : "auto" }}>
            {isoSizes.map(sizeRow)}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer", marginBottom: 6 }}>
            <input type="checkbox" checked={infiniteCanvas} onChange={(e) => setInfiniteCanvas(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--accent)" }} />
            <InfinityIcon size={15} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: 12.5, color: "var(--text)" }}>Infinite canvas (free-form)</span>
          </label>

          <button onClick={insertPageBreak} disabled={infiniteCanvas} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 12.5, color: "var(--text-secondary)", border: "1px solid var(--border-strong)", opacity: infiniteCanvas ? 0.5 : 1 }}>
            <SeparatorHorizontal size={14} /> Insert page break
          </button>

          {/* Paper texture — per document */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px" }}>
            Paper texture {!textureUnlocked && <Lock size={11} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, opacity: activeDocId ? 1 : 0.45, pointerEvents: activeDocId ? "auto" : "none" }}>
            {PAPER_TEXTURES.map((t) => {
              const active = currentTexture === t.id;
              const apply = () => { setPaperTexture(t.id); showToast(t.id === "plain" ? "Plain paper." : `${t.label} paper applied.`); };
              return (
                <button
                  key={t.id}
                  // "Plain" (turning a texture off) is always allowed; the rest are Pro.
                  onClick={t.id === "plain" ? apply : gated("paperTexture", apply)}
                  title={`${t.label} paper`}
                  style={{ display: "flex", flexDirection: "column", gap: 5, padding: 5, borderRadius: 9, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)", position: "relative" }}
                >
                  <span style={{ height: 30, borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-elev)", backgroundImage: t.image === "none" ? undefined : t.image, backgroundSize: t.size, display: "block" }} />
                  <span style={{ fontSize: 11.5, color: active ? "var(--accent)" : "var(--text-secondary)", textAlign: "center" }}>{t.label}</span>
                  {!textureUnlocked && t.id !== "plain" && <Lock size={10} style={{ position: "absolute", top: 7, right: 7, color: "var(--text-tertiary)" }} />}
                </button>
              );
            })}
          </div>

          {/* Advanced grid configuration (Pro) */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 8px" }}>
            <Grid3x3 size={12} /> Grid &amp; canvas {!gridUnlocked && <Lock size={11} />}
          </div>
          <div style={{ opacity: gridUnlocked ? 1 : 0.55 }}>
            <Slider label="Grid size" value={grid.cellSize} min={12} max={64} suffix="px"
              onChange={(v) => { if (requireFeature("advancedGrid")) setGrid({ cellSize: v }); }} disabled={!gridUnlocked} />
            <Slider label="Dot distance" value={grid.dotDistance} min={12} max={64} suffix="px"
              onChange={(v) => { if (requireFeature("advancedGrid")) setGrid({ dotDistance: v }); }} disabled={!gridUnlocked} />
            <Slider label="Opacity" value={Math.round(grid.opacity * 100)} min={5} max={100} suffix="%"
              onChange={(v) => { if (requireFeature("gridCustomColor")) setGrid({ opacity: v / 100 }); }} disabled={!gridUnlocked} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-secondary)", flex: 1 }}>Line / dot color</span>
              <input
                type="color"
                value={grid.color ?? "#888888"}
                onChange={(e) => { if (requireFeature("gridCustomColor")) setGrid({ color: e.target.value, locked: true }); }}
                disabled={!gridUnlocked}
                title="Custom color (locks across theme switches)"
                style={{ width: 26, height: 22, border: "1px solid var(--border)", borderRadius: 6, background: "transparent", cursor: gridUnlocked ? "pointer" : "default" }}
              />
              <button title="Auto (follows theme)" onClick={() => { if (requireFeature("gridCustomColor")) setGrid({ color: null, locked: false }); }} style={{ display: "flex", alignItems: "center", color: "var(--text-tertiary)", padding: 3 }}>
                <RotateCcw size={13} />
              </button>
            </div>
            <p style={{ fontSize: 10.5, color: "var(--text-tertiary)", lineHeight: 1.5, margin: "6px 0 0" }}>
              {grid.color ? "Custom color is locked — it won't change when you switch themes." : "Auto color inverts with the theme to stay visible."}
            </p>
          </div>

          {/* Page margins (Pro) */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 8px" }}>
            Page margins {!layoutUnlocked && <Lock size={11} />}
          </div>
          <div style={{ opacity: layoutUnlocked ? 1 : 0.55 }}>
            <Slider label="Margin" value={pageMargin} min={0} max={120} suffix="px"
              onChange={(v) => { if (requireFeature("pageLayout")) setPageMargin(v); }} disabled={!layoutUnlocked} />
            <p style={{ fontSize: 10.5, color: "var(--text-tertiary)", lineHeight: 1.5, margin: "2px 0 0" }}>Applies when page borders are on. 0 = theme default.</p>
          </div>
        </div>
      )}
    </div>
  );
}
