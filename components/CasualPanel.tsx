"use client";

import { useMemo } from "react";
import { Coffee, Moon, Brush, NotebookPen, ImagePlus, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { ResizeHandle } from "./ResizeHandle";

const PROMPTS = [
  "What's one small thing that went well today?",
  "Describe this moment using only your senses.",
  "Write a letter to your future self.",
  "What are you grateful for right now?",
  "If today had a colour, what would it be — and why?",
  "Capture a conversation you keep replaying.",
  "What would you do with a completely free afternoon?",
];

export function CasualPanel({ text }: { text: string }) {
  const aiPanelWidth = useStore((s) => s.aiPanelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const toggleZen = useStore((s) => s.toggleZen);
  const toggleDoodleMode = useStore((s) => s.toggleDoodleMode);
  const toggleSplitView = useStore((s) => s.toggleSplitView);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0), [text]);
  const prompt = useMemo(() => PROMPTS[new Date().getDate() % PROMPTS.length], []);

  const navBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", color: "var(--text)", fontSize: 13, marginBottom: 7, background: "var(--bg-elev-2)" };

  return (
    <aside style={{ width: aiPanelWidth, flexShrink: 0, height: "100%", position: "relative", background: "var(--bg-elev)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <ResizeHandle side="left" width={aiPanelWidth} min={260} max={460} onChange={(w) => setPanelWidth("ai", w)} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 14, borderBottom: "1px solid var(--border)" }}>
        <Coffee size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Journal</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{today}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", margin: "2px 0 16px" }}>{words.toLocaleString()} words today</div>

        <div style={{ padding: 14, borderRadius: 12, background: "var(--accent-soft)", border: "1px solid var(--accent)", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--accent)", fontWeight: 600, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <Sparkles size={13} /> Today's prompt
          </div>
          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{prompt}</div>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 9 }}>Calm tools</div>
        <button style={navBtn} onClick={toggleZen}><Moon size={15} style={{ color: "var(--accent)" }} /> Zen mode — fade everything away</button>
        <button style={navBtn} onClick={toggleDoodleMode}><Brush size={15} style={{ color: "var(--accent)" }} /> Doodle on the page</button>
        <button style={navBtn} onClick={toggleSplitView}><NotebookPen size={15} style={{ color: "var(--accent)" }} /> Notes & research panel</button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", fontSize: 12, color: "var(--text-tertiary)" }}>
          <ImagePlus size={15} /> Paste or drop images right into the page.
        </div>
      </div>
    </aside>
  );
}
