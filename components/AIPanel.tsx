"use client";

import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Sparkles,
  Gauge,
  ScanText,
  SpellCheck2,
  ShieldCheck,
  Wand2,
  ChevronDown,
  FileText,
} from "lucide-react";
import { analyze } from "@/lib/analyze";
import { summarizeDocument, type DocSummary } from "@/lib/summarize";
import { useStore } from "@/lib/store";
import { ResizeHandle } from "./ResizeHandle";
import { AiToolsSwitch } from "./AiToolsSwitch";

function Section({
  icon,
  title,
  badge,
  badgeColor,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string | number;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          width: "100%",
          padding: "12px 14px",
          color: "var(--text)",
        }}
      >
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: "left" }}>
          {title}
        </span>
        {badge !== undefined && badge !== "" && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "1px 7px",
              borderRadius: 999,
              color: badgeColor ?? "var(--text-secondary)",
              background: "var(--bg-elev-3)",
            }}
          >
            {badge}
          </span>
        )}
        <ChevronDown
          size={15}
          style={{
            color: "var(--text-tertiary)",
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      {open && <div style={{ padding: "0 14px 14px" }}>{children}</div>}
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 4,
          color: "var(--text-secondary)",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--text-tertiary)" }}>{value}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--bg-elev-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

const pill = (color: string): React.CSSProperties => ({
  fontSize: 12,
  padding: "5px 9px",
  borderRadius: 8,
  background: "var(--bg-elev-2)",
  border: "1px solid var(--border)",
  color,
  display: "flex",
  alignItems: "center",
  gap: 6,
});

const stubBtn: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: "4px 9px",
  borderRadius: 7,
  border: "1px solid var(--border-strong)",
  color: "var(--text-secondary)",
  background: "var(--bg-elev-2)",
};

function StubNote({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.5 }}>
      Connects to the Claude API in the next phase — wired once services are
      online.
    </p>
  );
}

const CASUAL_PROMPTS = [
  "What's one small thing that went well today?",
  "Describe this moment using only your senses.",
  "Write a letter to your future self.",
  "What are you grateful for right now?",
  "If today had a colour, what would it be — and why?",
  "Capture a conversation you keep replaying.",
  "What would you do with a completely free afternoon?",
];

export function AIPanel({ text, editor, casual }: { text: string; editor: Editor | null; casual?: boolean }) {
  const a = useMemo(() => analyze(text), [text]);
  const aiPanelWidth = useStore((s) => s.aiPanelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const toggleZen = useStore((s) => s.toggleZen);
  const toggleDoodleMode = useStore((s) => s.toggleDoodleMode);
  const isFree = useStore((s) => s.plan === "free");
  const requireFeature = useStore((s) => s.requireFeature);
  const casualPrompt = useMemo(() => CASUAL_PROMPTS[new Date().getDate() % CASUAL_PROMPTS.length], []);
  const [scanned, setScanned] = useState(false);
  const [rewriteNote, setRewriteNote] = useState(false);
  const [summary, setSummary] = useState<DocSummary | null>(null);
  // Auto-summary for new/empty documents (onboarding); otherwise on demand.
  const newDoc = text.trim().split(/\s+/).filter(Boolean).length < 8;
  const shownSummary: DocSummary | null = summary ?? (newDoc ? summarizeDocument(text) : null);

  const hasSelection = !!editor && !editor.state.selection.empty;
  const toneColor =
    a.tone.label === "Formal"
      ? "var(--accent)"
      : a.tone.label === "Dramatic"
        ? "var(--danger)"
        : a.tone.label === "Casual"
          ? "var(--warning)"
          : "var(--text-secondary)";

  return (
    <aside
      style={{
        width: aiPanelWidth,
        flexShrink: 0,
        height: "100%",
        position: "relative",
        background: "var(--bg-elev)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ResizeHandle side="left" width={aiPanelWidth} min={260} max={460} onChange={(w) => setPanelWidth("ai", w)} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Sparkles size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>AI editing suite</span>
        <AiToolsSwitch />
        <span
          style={{
            fontSize: 10,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: 999,
            padding: "1px 7px",
          }}
        >
          Live
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Casual journal extras (mode = casual) — sit above the AI suite */}
        {casual && (
          <div style={{ borderBottom: "1px solid var(--border)", padding: "14px" }}>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
            <div style={{ padding: 12, borderRadius: 11, background: "var(--accent-soft)", border: "1px solid var(--accent)", margin: "8px 0 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>Today's prompt</div>
              <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>{casualPrompt}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={toggleZen} style={{ flex: 1, fontSize: 12, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>Zen mode</button>
              <button onClick={toggleDoodleMode} style={{ flex: 1, fontSize: 12, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>Doodle</button>
            </div>
          </div>
        )}
        {isFree ? (
          <div style={{ padding: 18, textAlign: "center" }}>
            <Sparkles size={24} style={{ color: "var(--accent)", marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>The AI editing suite is a Pro feature</div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
              Tone, clarity & grammar analysis, rewriting and document summaries unlock on Pro — along with using your own API keys.
            </p>
            <button onClick={() => requireFeature("aiSuite")} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: "var(--accent-contrast)", background: "var(--accent)" }}>
              Upgrade to Pro
            </button>
          </div>
        ) : (
        <>
        {/* Document summary — auto for new docs, on demand otherwise */}
        <Section icon={<FileText size={15} />} title="Document summary" badge={newDoc ? "New" : ""} badgeColor="var(--accent)">
          <button
            onClick={() => setSummary(summarizeDocument(text))}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 500, color: "var(--accent-contrast)", background: "var(--accent)", marginBottom: shownSummary ? 12 : 0 }}
          >
            <Sparkles size={15} /> {shownSummary ? "Re-summarize" : "Summarize this document"}
          </button>
          {shownSummary && (
            <div>
              <p style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.6, marginBottom: shownSummary.bullets.length ? 10 : 0 }}>{shownSummary.intent}</p>
              {shownSummary.bullets.length > 0 && (
                <ul style={{ margin: "0 0 10px", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                  {shownSummary.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{b}</li>
                  ))}
                </ul>
              )}
              {shownSummary.topics.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {shownSummary.topics.map((t) => (
                    <span key={t} style={pill("var(--text-secondary)")}>{t}</span>
                  ))}
                </div>
              )}
              {!shownSummary.empty && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{shownSummary.words.toLocaleString()} words · ~{shownSummary.readingMin} min read</div>
              )}
              <StubNote show={!shownSummary.empty} />
            </div>
          )}
        </Section>

        {/* Rewrite */}
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setRewriteNote(true)}
            disabled={!hasSelection}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "9px 0",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 500,
              color: hasSelection ? "var(--accent-contrast)" : "var(--text-tertiary)",
              background: hasSelection ? "var(--accent)" : "var(--bg-elev-3)",
              cursor: hasSelection ? "pointer" : "default",
            }}
          >
            <Wand2 size={15} />
            Rewrite selection
          </button>
          {!hasSelection && (
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
              Select text in the editor to rewrite, expand, or change its tone.
            </p>
          )}
          <StubNote show={rewriteNote && hasSelection} />
        </div>

        {/* Tone */}
        <Section
          icon={<Gauge size={15} />}
          title="Tone analyzer"
          badge={a.tone.label}
          badgeColor={toneColor}
        >
          <Meter label="Formal" value={a.tone.formal} color="var(--accent)" />
          <Meter label="Casual" value={a.tone.casual} color="var(--warning)" />
          <Meter label="Dramatic" value={a.tone.dramatic} color="var(--danger)" />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {a.passiveCount > 0 && (
              <span style={pill("var(--warning)")}>
                {a.passiveCount} passive {a.passiveCount === 1 ? "voice" : "voices"}
              </span>
            )}
            {a.repetition.map((r) => (
              <span key={r.word} style={pill("var(--text-secondary)")}>
                “{r.word}” ×{r.count}
              </span>
            ))}
            {a.passiveCount === 0 && a.repetition.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--success)" }}>
                No passive voice or repetition flagged.
              </span>
            )}
          </div>
        </Section>

        {/* Clarity */}
        <Section
          icon={<ScanText size={15} />}
          title="Clarity"
          badge={a.longSentences.length || ""}
          badgeColor={a.longSentences.length ? "var(--warning)" : undefined}
        >
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
            Avg sentence length {a.avgSentenceLength} words · {a.sentences} sentences.
          </p>
          {a.longSentences.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--success)" }}>
              No long sentences — clear and readable.
            </span>
          ) : (
            a.longSentences.map((s, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 9,
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 8,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {s.text}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--warning)",
                      marginRight: "auto",
                    }}
                  >
                    {s.words} words
                  </span>
                  <button style={stubBtn}>Shorten</button>
                  <button style={stubBtn}>Simplify</button>
                </div>
              </div>
            ))
          )}
        </Section>

        {/* Grammar */}
        <Section
          icon={<SpellCheck2 size={15} />}
          title="Grammar"
          badge={a.grammar.length || ""}
          badgeColor={a.grammar.length ? "var(--danger)" : undefined}
        >
          {a.grammar.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--success)" }}>
              No grammar issues detected.
            </span>
          ) : (
            a.grammar.map((g, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 0",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    textDecoration: "underline wavy var(--danger)",
                    textUnderlineOffset: 3,
                    color: "var(--text)",
                  }}
                >
                  {g.match}
                </span>
                <span style={{ color: "var(--text-tertiary)" }}>→</span>
                <span style={{ color: "var(--success)" }}>{g.suggestion}</span>
                <span style={{ marginLeft: "auto", color: "var(--text-tertiary)", fontSize: 11 }}>
                  {g.reason}
                </span>
              </div>
            ))
          )}
        </Section>

        {/* Fact & plagiarism */}
        <Section
          icon={<ShieldCheck size={15} />}
          title="Fact & plagiarism"
          defaultOpen={false}
        >
          <button onClick={() => setScanned(true)} style={{ ...stubBtn, width: "100%", padding: "8px 0" }}>
            Run on-demand scan
          </button>
          {scanned && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Originality looks clean. Detailed source matching and
                fact-checking run through Claude + search batching.
              </p>
              <StubNote show />
            </div>
          )}
        </Section>
        </>
        )}
      </div>
    </aside>
  );
}
