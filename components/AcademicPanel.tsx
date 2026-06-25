"use client";

import { useState } from "react";
import { GraduationCap, BookMarked, Plus, Trash2, Quote, ListPlus, Camera, History, LayoutGrid, Columns2, FolderTree, Target } from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import { ResizeHandle } from "./ResizeHandle";
import { AiToolsSwitch } from "./AiToolsSwitch";
import type { Citation } from "@/lib/types";

function surname(authors: string): string {
  const first = authors.split(/[,&]/)[0]?.trim() ?? authors;
  return first || authors;
}
type CiteStyle = "apa" | "mla";
function inlineCite(c: Citation, style: CiteStyle): string {
  return style === "mla" ? `(${surname(c.authors)})` : `(${surname(c.authors)}, ${c.year})`;
}
function bibEntry(c: Citation, style: CiteStyle): string {
  if (style === "mla") {
    const parts = [`${c.authors}. "${c.title}."`];
    if (c.source) parts.push(` <i>${c.source}</i>,`);
    parts.push(` ${c.year}.`);
    if (c.url) parts.push(` ${c.url}.`);
    return parts.join("");
  }
  const parts = [`${c.authors} (${c.year}). ${c.title}.`];
  if (c.source) parts.push(` <i>${c.source}</i>.`);
  if (c.url) parts.push(` ${c.url}`);
  return parts.join("");
}

export function AcademicPanel() {
  const editor = useEditorInstance();
  const aiPanelWidth = useStore((s) => s.aiPanelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const citations = useStore((s) => s.citations);
  const addCitation = useStore((s) => s.addCitation);
  const removeCitation = useStore((s) => s.removeCitation);
  const setCorkboardOpen = useStore((s) => s.setCorkboardOpen);
  const toggleSplitView = useStore((s) => s.toggleSplitView);
  const setVersionHistoryOpen = useStore((s) => s.setVersionHistoryOpen);
  const pushVersion = useStore((s) => s.pushVersion);
  const showToast = useStore((s) => s.showToast);
  const doc = useStore(selectActiveDoc);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Citation, "id">>({ type: "article", authors: "", year: "", title: "", source: "", url: "" });
  const [style, setStyle] = useState<CiteStyle>("apa");
  const [goal, setGoal] = useState(1000);
  const words = editor ? (editor.getText().trim() ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0) : 0;

  const insertInline = (c: Citation) => editor?.chain().focus().insertContent(inlineCite(c, style) + " ").run();
  const insertBibliography = () => {
    if (!editor || citations.length === 0) return;
    const heading = style === "mla" ? "Works Cited" : "References";
    const items = citations.map((c) => `<p style="padding-left:2em;text-indent:-2em">${bibEntry(c, style)}</p>`).join("");
    editor.commands.insertContentAt(editor.state.doc.content.size, `<h2>${heading}</h2>${items}`);
    showToast(`${heading} inserted (${style.toUpperCase()}).`);
  };
  const snapshot = () => {
    if (!editor || !doc) return;
    const txt = editor.getText();
    const words = txt.trim() ? txt.trim().split(/\s+/).filter(Boolean).length : 0;
    pushVersion(doc.id, editor.getHTML(), words, true);
    showToast("Snapshot saved to version history.");
  };

  const submit = () => {
    if (!form.authors.trim() || !form.title.trim()) return;
    addCitation(form);
    setForm({ type: "article", authors: "", year: "", title: "", source: "", url: "" });
    setAdding(false);
  };

  const Section = ({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</span>
        {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
      </div>
      {children}
    </div>
  );
  const fld: React.CSSProperties = { width: "100%", padding: "6px 9px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 12, marginBottom: 6, outline: "none" };
  const navBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)", fontSize: 12.5, marginBottom: 6 };

  return (
    <aside style={{ width: aiPanelWidth, flexShrink: 0, height: "100%", position: "relative", background: "var(--bg-elev)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <ResizeHandle side="left" width={aiPanelWidth} min={260} max={460} onChange={(w: number) => setPanelWidth("ai", w)} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 14, borderBottom: "1px solid var(--border)" }}>
        <GraduationCap size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Academic studio</span>
        <AiToolsSwitch />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Project tools */}
        <Section icon={<FolderTree size={15} />} title="Project & layout">
          <button style={navBtn} onClick={() => setCorkboardOpen(true)}><LayoutGrid size={14} /> Corkboard (index cards)</button>
          <button style={navBtn} onClick={toggleSplitView}><Columns2 size={14} /> Split editor (write + research)</button>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>The sidebar is your <b>Binder</b> — nest chapters, sections & fragments and drag to reorder.</p>
        </Section>

        {/* Writing target (Scrivener-style) */}
        <Section icon={<Target size={15} />} title="Writing target">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{words.toLocaleString()}<span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 400 }}> / {goal.toLocaleString()} words</span></span>
            <span style={{ fontSize: 12, color: words >= goal ? "var(--success)" : "var(--text-tertiary)" }}>{Math.min(100, Math.round((words / Math.max(1, goal)) * 100))}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--bg-elev-3)", overflow: "hidden", marginBottom: 9 }}>
            <div style={{ width: `${Math.min(100, (words / Math.max(1, goal)) * 100)}%`, height: "100%", background: words >= goal ? "var(--success)" : "var(--accent)", transition: "width 0.3s" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Goal</span>
            {[500, 1000, 2500, 5000].map((g) => (
              <button key={g} onClick={() => setGoal(g)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, border: goal === g ? "1px solid var(--accent)" : "1px solid var(--border)", background: goal === g ? "var(--accent-soft)" : "var(--bg-elev-2)", color: goal === g ? "var(--accent)" : "var(--text-secondary)" }}>{g >= 1000 ? `${g / 1000}k` : g}</button>
            ))}
          </div>
        </Section>

        {/* Snapshots */}
        <Section icon={<Camera size={15} />} title="Snapshots">
          <button style={navBtn} onClick={snapshot}><Camera size={14} /> Take a snapshot of this section</button>
          <button style={navBtn} onClick={() => setVersionHistoryOpen(true)}><History size={14} /> Open snapshot history</button>
        </Section>

        {/* Citations */}
        <Section
          icon={<BookMarked size={15} />}
          title={`Citation library (${citations.length})`}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
                {(["apa", "mla"] as const).map((st) => (
                  <button key={st} onClick={() => setStyle(st)} style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", background: style === st ? "var(--accent)" : "transparent", color: style === st ? "var(--accent-contrast)" : "var(--text-secondary)" }}>{st.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={() => setAdding((a) => !a)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--accent)", fontWeight: 500 }}><Plus size={13} /> Add</button>
            </div>
          }
        >
          {adding && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 9, background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Citation["type"] })} style={fld}>
                <option value="article">Journal article</option><option value="book">Book</option><option value="web">Website</option><option value="report">Report</option>
              </select>
              <input placeholder="Authors (e.g. Smith, J. & Doe, A.)" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} style={fld} />
              <div style={{ display: "flex", gap: 6 }}>
                <input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={{ ...fld, flex: "0 0 70px" }} />
                <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={fld} />
              </div>
              <input placeholder="Journal / publisher / site" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={fld} />
              <input placeholder="URL (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={fld} />
              <button onClick={submit} style={{ width: "100%", fontSize: 12, fontWeight: 500, padding: "7px 0", borderRadius: 7, background: "var(--accent)", color: "var(--accent-contrast)" }}>Save reference</button>
            </div>
          )}
          {citations.length === 0 && !adding && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No references yet. Add sources, then cite them inline.</span>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {citations.map((c) => (
              <div key={c.id} style={{ padding: "8px 10px", borderRadius: 9, background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 2 }}><b>{surname(c.authors)}</b> ({c.year})</div>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>{c.title}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => insertInline(c)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--accent)", fontWeight: 500 }}><Quote size={12} /> Cite inline</button>
                  <button onClick={() => removeCitation(c.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-tertiary)", marginLeft: "auto" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          {citations.length > 0 && (
            <button onClick={insertBibliography} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 10, fontSize: 12.5, fontWeight: 500, padding: "9px 0", borderRadius: 9, background: "var(--accent)", color: "var(--accent-contrast)" }}>
              <ListPlus size={15} /> Insert bibliography
            </button>
          )}
        </Section>
      </div>
    </aside>
  );
}
