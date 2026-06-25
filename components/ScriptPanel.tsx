"use client";

import { useMemo, useReducer, useEffect, useState } from "react";
import { Clapperboard, Film, Users, MapPin, FileDown, MessageSquareText, Palette, ListOrdered, FileText, Hash, UsersRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import { SCENE_ORDER, type ScriptElement } from "./extensions/Screenplay";
import { ResizeHandle } from "./ResizeHandle";
import { AiToolsSwitch } from "./AiToolsSwitch";

interface SceneInfo { heading: string; place: string; time: string; pos: number; }
interface Line { text: string; pos: number; }

const ELEMENT_LABELS: Record<ScriptElement, string> = {
  scene: "Scene", action: "Action", shot: "Shot", character: "Character", parenthetical: "Paren.", dialogue: "Dialogue", transition: "Transition",
};

// Standard production revision colors (Final Draft order)
const REV_COLORS = [
  { name: "Blue", c: "#cfe0ff" }, { name: "Pink", c: "#ffd6e7" }, { name: "Yellow", c: "#fff3c4" },
  { name: "Green", c: "#cdeccd" }, { name: "Goldenrod", c: "#f3e0a8" },
];

export function ScriptPanel() {
  const editor = useEditorInstance();
  const aiPanelWidth = useStore((s) => s.aiPanelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const sceneNumbers = useStore((s) => s.sceneNumbers);
  const setSceneNumbers = useStore((s) => s.setSceneNumbers);
  const showToast = useStore((s) => s.showToast);
  const [tick, bump] = useReducer((x) => x + 1, 0);
  const [tuneChar, setTuneChar] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", bump);
    return () => { editor.off("transaction", bump); };
  }, [editor]);

  const parsed = useMemo(() => {
    const scenes: SceneInfo[] = [];
    const characters = new Map<string, Line[]>();
    const charScenes = new Map<string, Set<number>>();
    const places = new Set<string>();
    const times = new Set<string>();
    if (editor) {
      let lastChar: string | null = null;
      let sceneIdx = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "paragraph") return;
        const sx = node.attrs.sceneElement as ScriptElement | null;
        const txt = node.textContent.trim();
        if (!sx || !txt) return;
        if (sx === "scene") {
          const m = txt.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)?\s*(.*?)\s*[-–]\s*(.*)$/i);
          const place = (m?.[2] || txt).toUpperCase();
          const time = (m?.[3] || "").toUpperCase();
          scenes.push({ heading: txt.toUpperCase(), place, time, pos });
          sceneIdx++;
          if (place) places.add(place);
          if (time) times.add(time);
          lastChar = null;
        } else if (sx === "character") {
          lastChar = txt.toUpperCase().replace(/\s*\(.*\)$/, "");
          if (!characters.has(lastChar)) { characters.set(lastChar, []); charScenes.set(lastChar, new Set()); }
          if (sceneIdx >= 0) charScenes.get(lastChar)!.add(sceneIdx);
        } else if (sx === "dialogue" && lastChar) {
          characters.get(lastChar)!.push({ text: txt, pos });
        }
      });
    }
    return { scenes, characters, charScenes, places: [...places], times: [...times] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, tick]);

  if (!editor) return null;

  const setEl = (el: ScriptElement) => editor.chain().focus().setScriptElement(el).run();
  const insertAtCursor = (t: string) => editor.chain().focus().insertContent(t).run();
  const jumpTo = (pos: number) => {
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
    const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
    if (dom) { dom.classList.add("review-spotlight"); setTimeout(() => dom.classList.remove("review-spotlight"), 2500); }
  };
  const markRevision = (c: string) => editor.chain().focus().setHighlight({ color: c }).run();
  // Dual dialogue: mark the current character+dialogue run as the RIGHT column and
  // the preceding character+dialogue run as the LEFT column (Final Draft-style).
  const makeDualDialogue = () => {
    const { doc, selection } = editor.state;
    type Blk = { pos: number; sx: ScriptElement | null };
    const blocks: Blk[] = [];
    doc.descendants((node, pos) => { if (node.type.name === "paragraph") blocks.push({ pos, sx: node.attrs.sceneElement as ScriptElement | null }); });
    const cur = blocks.findIndex((b) => selection.from >= b.pos && selection.from <= b.pos + 1 + (doc.nodeAt(b.pos)?.content.size ?? 0));
    if (cur < 0) { showToast("Place the cursor in the second speaker's block."); return; }
    // Walk back to the current speaker run (character + dialogues) and the previous one.
    const runStart = (i: number) => { while (i > 0 && blocks[i].sx !== "character") i--; return i; };
    const rStart = runStart(cur);
    const lEnd = rStart - 1;
    const lStart = lEnd >= 0 ? runStart(lEnd) : -1;
    if (lStart < 0 || blocks[rStart].sx !== "character" || blocks[lStart].sx !== "character") { showToast("Need two consecutive Character/Dialogue blocks to pair."); return; }
    const chain = editor.chain().focus();
    for (let i = lStart; i <= lEnd; i++) chain.setTextSelection(blocks[i].pos + 1).setDualDialogue("L");
    for (let i = rStart; i < blocks.length && (i === rStart || blocks[i].sx === "dialogue" || blocks[i].sx === "parenthetical"); i++) chain.setTextSelection(blocks[i].pos + 1).setDualDialogue("R");
    chain.run();
    showToast("Dual dialogue applied.");
  };
  const clearDual = () => {
    const chain = editor.chain().focus();
    editor.state.doc.descendants((node, pos) => { if (node.type.name === "paragraph" && node.attrs.dual) chain.setTextSelection(pos + 1).setDualDialogue(null); });
    chain.run();
  };
  // ~1 screenplay page ≈ 55 lines ≈ ~1500 chars of formatted script.
  const pages = Math.max(1, Math.round(editor.getText().length / 1500));
  const insertTitlePage = () =>
    editor.chain().focus().insertContentAt(0, `<h1 style="text-align:center">TITLE</h1><p style="text-align:center">Written by</p><p style="text-align:center">Your Name</p><hr>`).run();

  const downloadReport = () => {
    const L: string[] = ["SCRIPT BREAKDOWN REPORT", "=".repeat(40), ""];
    L.push(`Scenes: ${parsed.scenes.length}   Cast: ${parsed.characters.size}   Locations: ${parsed.places.length}`, "");
    L.push("SCENES", "-".repeat(20));
    parsed.scenes.forEach((s, i) => L.push(`${i + 1}. ${s.heading}`));
    L.push("", "CAST (lines · scenes)", "-".repeat(20));
    [...parsed.characters.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([n, lines]) => L.push(`${n} — ${lines.length} line${lines.length === 1 ? "" : "s"}, ${parsed.charScenes.get(n)?.size ?? 0} scene${(parsed.charScenes.get(n)?.size ?? 0) === 1 ? "" : "s"}`));
    L.push("", "LOCATIONS", "-".repeat(20));
    parsed.places.forEach((p) => L.push(`• ${p}`));
    const blob = new Blob([L.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "script-breakdown.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
  const chip = (label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} onClick={onClick} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--bg-elev-2)", color: "var(--text-secondary)" }}>{label}</button>
  );

  const tuneLines = tuneChar ? parsed.characters.get(tuneChar) ?? [] : [];

  return (
    <aside style={{ width: aiPanelWidth, flexShrink: 0, height: "100%", position: "relative", background: "var(--bg-elev)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <ResizeHandle side="left" width={aiPanelWidth} min={260} max={460} onChange={(w) => setPanelWidth("ai", w)} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 14, borderBottom: "1px solid var(--border)" }}>
        <Clapperboard size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Screenplay</span>
        <AiToolsSwitch />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Element formatter */}
        <Section icon={<Film size={15} />} title="Element format (Tab to cycle)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {SCENE_ORDER.map((el) => (
              <button key={el} onClick={() => setEl(el)} style={{ fontSize: 11.5, padding: "6px 4px", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)", background: "var(--bg-elev-2)" }}>{ELEMENT_LABELS[el]}</button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Type a line, press <b>Tab</b> to set its type, <b>Enter</b> auto-advances (Character → Dialogue → Action…).</p>
        </Section>

        {/* Format & production options */}
        <Section icon={<Hash size={15} />} title="Format & production">
          <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={sceneNumbers} onChange={(e) => setSceneNumbers(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--accent)" }} />
            <span style={{ fontSize: 12.5, color: "var(--text)" }}>Auto scene numbers</span>
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={makeDualDialogue} style={{ flex: 1, fontSize: 11.5, padding: "7px 0", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)", background: "var(--bg-elev-2)" }}>Dual dialogue</button>
            <button onClick={clearDual} title="Clear dual dialogue" style={{ fontSize: 11.5, padding: "7px 12px", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-tertiary)" }}>Clear</button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Character extensions:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            {[" (V.O.)", " (O.S.)", " (CONT'D)", " (O.C.)"].map((x) => chip(x.trim(), () => insertAtCursor(x)))}
          </div>
        </Section>

        {/* Scene navigator + page estimate */}
        <Section icon={<ListOrdered size={15} />} title="Scene navigator">
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
            <span><FileText size={12} style={{ verticalAlign: "-2px" }} /> ~{pages} page{pages === 1 ? "" : "s"}</span>
            <button onClick={insertTitlePage} style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--accent)", fontWeight: 500 }}>+ Title page</button>
          </div>
          {parsed.scenes.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Add Scene elements (INT./EXT.) to build a navigable scene list.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {parsed.scenes.map((s, i) => (
                <button key={i} onClick={() => jumpTo(s.pos)} style={{ display: "flex", gap: 8, textAlign: "left", fontSize: 11.5, color: "var(--text-secondary)", padding: "6px 8px", borderRadius: 7, background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-tertiary)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.heading}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Smart autocomplete sources */}
        <Section icon={<MapPin size={15} />} title="Autocomplete · scenes & locations">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {["INT. ", "EXT. ", " - DAY", " - NIGHT", " - CONTINUOUS"].map((t) => chip(t.trim(), () => insertAtCursor(t)))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {parsed.places.length === 0 && parsed.times.length === 0
              ? <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Known locations & times appear here as you write scene headings.</span>
              : [...parsed.places, ...parsed.times].slice(0, 12).map((p) => chip(p, () => insertAtCursor(p), p))}
          </div>
        </Section>

        {/* Dialogue tuner */}
        <Section icon={<MessageSquareText size={15} />} title="Dialogue tuner">
          {parsed.characters.size === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Add Character + Dialogue elements to tune a character's voice.</span>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {[...parsed.characters.keys()].map((n) => (
                  <button key={n} onClick={() => setTuneChar(n === tuneChar ? null : n)} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 999, border: tuneChar === n ? "1px solid var(--accent)" : "1px solid var(--border-strong)", background: tuneChar === n ? "var(--accent-soft)" : "var(--bg-elev-2)", color: tuneChar === n ? "var(--accent)" : "var(--text-secondary)" }}>
                    {n} <span style={{ opacity: 0.7 }}>({parsed.characters.get(n)!.length})</span>
                  </button>
                ))}
              </div>
              {tuneChar && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>All of {tuneChar}'s lines — click to jump & edit:</div>
                  {tuneLines.map((l, i) => (
                    <button key={i} onClick={() => jumpTo(l.pos)} style={{ textAlign: "left", fontSize: 12, color: "var(--text)", padding: "7px 9px", borderRadius: 8, background: "var(--bg-elev-2)", border: "1px solid var(--border)", lineHeight: 1.45 }}>“{l.text}”</button>
                  ))}
                </div>
              )}
            </>
          )}
        </Section>

        {/* Character report */}
        <Section icon={<UsersRound size={15} />} title="Character report">
          {parsed.characters.size === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Cast stats appear here as characters speak.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[...parsed.characters.entries()].sort((a, b) => b[1].length - a[1].length).map(([n, lines]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "5px 8px", borderRadius: 7, background: "var(--bg-elev-2)" }}>
                  <span style={{ color: "var(--text)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>{lines.length} line{lines.length === 1 ? "" : "s"}</span>
                  <span style={{ color: "var(--text-tertiary)" }}>· {parsed.charScenes.get(n)?.size ?? 0} sc.</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Revision colors */}
        <Section icon={<Palette size={15} />} title="Revision mode">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REV_COLORS.map((r) => (
              <button key={r.name} onClick={() => markRevision(r.c)} title={`Mark selection — ${r.name} revision`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "4px 9px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--bg-elev-2)", color: "var(--text-secondary)" }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: r.c }} /> {r.name}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Select altered text, then tag it with a standard production revision color.</p>
        </Section>

        {/* Breakdown report */}
        <Section icon={<Users size={15} />} title="Breakdown & reports">
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
            <span><b style={{ color: "var(--text)" }}>{parsed.scenes.length}</b> scenes</span>
            <span><b style={{ color: "var(--text)" }}>{parsed.characters.size}</b> cast</span>
            <span><b style={{ color: "var(--text)" }}>{parsed.places.length}</b> locations</span>
          </div>
          <button onClick={downloadReport} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", justifyContent: "center", fontSize: 12.5, fontWeight: 500, padding: "9px 0", borderRadius: 9, background: "var(--accent)", color: "var(--accent-contrast)" }}>
            <FileDown size={15} /> Download production report
          </button>
        </Section>
      </div>
    </aside>
  );
}
