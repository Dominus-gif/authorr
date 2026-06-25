"use client";

import { Sparkles, PanelLeftClose } from "lucide-react";
import { useStore } from "@/lib/store";

/** In-panel switch between a mode's tools and the AI editing suite. Lives in
 *  each panel header so it never competes with the top-bar show/hide button. */
export function AiToolsSwitch() {
  const workMode = useStore((s) => s.workMode);
  const aiSuiteOverride = useStore((s) => s.aiSuiteOverride);
  const setAiSuiteOverride = useStore((s) => s.setAiSuiteOverride);

  // In Casual the AI suite IS the panel — no mode tools to switch to.
  if (workMode === "casual") return null;
  const showingAI = aiSuiteOverride;

  // A two-segment toggle so Tools vs AI read as two distinct, equal-size options.
  const seg = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flex: 1,
    minWidth: 64,
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 0",
    borderRadius: 7,
    color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
    background: active ? "var(--accent)" : "transparent",
    transition: "background .12s ease",
  });

  return (
    <div
      role="tablist"
      aria-label="Panel mode"
      style={{ marginLeft: "auto", display: "flex", gap: 3, padding: 3, borderRadius: 9, background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}
    >
      <button role="tab" aria-selected={!showingAI} title="Mode tools" onClick={() => setAiSuiteOverride(false)} style={seg(!showingAI)}>
        <PanelLeftClose size={12} /> Tools
      </button>
      <button role="tab" aria-selected={showingAI} title="AI editing suite" onClick={() => setAiSuiteOverride(true)} style={seg(showingAI)}>
        <Sparkles size={12} /> AI
      </button>
    </div>
  );
}
