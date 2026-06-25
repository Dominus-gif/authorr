"use client";

import { useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { Gauge, Activity, Droplets, Briefcase, BarChart3, Award, Repeat } from "lucide-react";
import { proAnalyze } from "@/lib/prowriting";
import { useStore } from "@/lib/store";
import { ResizeHandle } from "./ResizeHandle";
import { AiToolsSwitch } from "./AiToolsSwitch";

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function ProfessionalPanel({ text, editor }: { text: string; editor: Editor | null }) {
  const r = useMemo(() => proAnalyze(text), [text]);
  const aiPanelWidth = useStore((s) => s.aiPanelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);

  const easeColor = r.readingEase >= 60 ? "var(--success)" : r.readingEase >= 40 ? "var(--warning)" : "var(--danger)";
  const maxLen = Math.max(1, ...r.lengths);

  const scrollTo = (sentence: string) => {
    if (!editor) return;
    const probe = sentence.slice(0, 40);
    let pos = -1;
    editor.state.doc.descendants((node, p) => {
      if (pos >= 0 || !node.isText || !node.text) return;
      const idx = node.text.indexOf(probe.slice(0, 20));
      if (idx >= 0) pos = p + idx;
    });
    if (pos >= 0) editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  return (
    <aside style={{ width: aiPanelWidth, flexShrink: 0, height: "100%", position: "relative", background: "var(--bg-elev)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <ResizeHandle side="left" width={aiPanelWidth} min={260} max={460} onChange={(w) => setPanelWidth("ai", w)} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px", borderBottom: "1px solid var(--border)" }}>
        <Briefcase size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Professional editor</span>
        <AiToolsSwitch />
        <span style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 999, padding: "1px 7px" }}>Live</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Overall writing score */}
        <Card icon={<Award size={15} />} title="Writing score">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: 58, height: 58, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--bg-elev-3)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={r.score >= 75 ? "var(--success)" : r.score >= 50 ? "var(--warning)" : "var(--danger)"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(r.score / 100) * 97.4} 97.4`} />
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{r.score}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {r.score >= 75 ? "Strong, clear writing." : r.score >= 50 ? "Solid — a few tightening opportunities below." : "Several areas to tighten — see the cards below."}
            </div>
          </div>
        </Card>

        {/* Readability */}
        <Card icon={<Gauge size={15} />} title="Readability">
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: easeColor, fontVariantNumeric: "tabular-nums" }}>{r.readingEase}</span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>/ 100 reading ease</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: "var(--bg-elev-3)", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${r.readingEase}%`, height: "100%", background: easeColor }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.gradeLabel} · avg {r.avgSentence} words/sentence</div>
          {r.passive > 0 && <div style={{ fontSize: 12, color: "var(--warning)", marginTop: 6 }}>{r.passive} passive-voice construction{r.passive === 1 ? "" : "s"}</div>}
        </Card>

        {/* Sentence-length variety map */}
        <Card icon={<BarChart3 size={15} />} title="Sentence-length variety">
          {r.lengths.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Write a few sentences to see the rhythm map.</span>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
                {r.lengths.slice(0, 60).map((l, i) => {
                  const col = l > 30 ? "var(--danger)" : l < 6 ? "var(--text-tertiary)" : "var(--accent)";
                  return <div key={i} title={`${l} words`} style={{ flex: 1, minWidth: 2, height: `${Math.max(6, (l / maxLen) * 100)}%`, background: col, borderRadius: 1 }} />;
                })}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
                Mix short & long sentences for natural pacing. Red = over 30 words.
              </div>
            </>
          )}
        </Card>

        {/* Sticky / glue sentences */}
        <Card icon={<Droplets size={15} />} title={`Sticky sentences (${r.sticky.length})`}>
          {r.sticky.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--success)" }}>No sticky sentences — copy reads cleanly.</span>
          ) : (
            r.sticky.slice(0, 6).map((s, i) => (
              <button key={i} onClick={() => scrollTo(s.text)} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: 9, borderRadius: 9, background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.text}</div>
                <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 5 }}>{s.gluePct}% glue words · {s.wordCount} words — tighten this</div>
              </button>
            ))
          )}
        </Card>

        {/* Business jargon */}
        <Card icon={<Activity size={15} />} title={`Jargon filter (${r.jargon.length})`}>
          {r.jargon.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--success)" }}>No corporate jargon detected.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {r.jargon.map((j) => (
                <div key={j.phrase} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ color: "var(--danger)", fontWeight: 500, textDecoration: "underline wavy var(--danger)", textUnderlineOffset: 3 }}>{j.phrase}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>→</span>
                  <span style={{ color: "var(--success)" }}>{j.suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overused & vague words */}
        <Card icon={<Repeat size={15} />} title="Word choice">
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
            {r.adverbs > 0 ? `${r.adverbs} -ly adverb${r.adverbs === 1 ? "" : "s"} — prefer strong verbs.` : "Lean on strong verbs — no adverb overload."}
          </div>
          {r.overused.length > 0 && (
            <div style={{ marginBottom: r.vague.length ? 10 : 0 }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>Overused words</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {r.overused.map((o) => (
                  <span key={o.word} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 999, background: "var(--bg-elev-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{o.word} ×{o.count}</span>
                ))}
              </div>
            </div>
          )}
          {r.vague.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>Vague / filler</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {r.vague.map((v) => (
                  <span key={v.word} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 999, background: "color-mix(in srgb, var(--warning) 14%, transparent)", color: "var(--warning)" }}>{v.word} ×{v.count}</span>
                ))}
              </div>
            </div>
          )}
          {r.overused.length === 0 && r.vague.length === 0 && r.adverbs === 0 && (
            <span style={{ fontSize: 12, color: "var(--success)" }}>Varied, precise word choice.</span>
          )}
        </Card>
      </div>
    </aside>
  );
}
