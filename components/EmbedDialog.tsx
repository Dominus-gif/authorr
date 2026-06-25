"use client";

import { useState } from "react";
import { X, Globe, Code2, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

const URL_EXAMPLES: { label: string; url: string }[] = [
  { label: "Observable chart", url: "https://observablehq.com/embed/@d3/bar-chart?cell=chart" },
  { label: "CodePen", url: "https://codepen.io/team/codepen/embed/PNaGbb" },
  { label: "Google Sheets chart", url: "https://docs.google.com/spreadsheets/d/.../pubchart?oid=...&format=interactive" },
];

const CODE_TEMPLATE = `<!doctype html><html><body style="font-family:system-ui;margin:0;padding:16px">
<canvas id="c" width="400" height="180"></canvas>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  const data = [40, 80, 55, 95, 70];
  data.forEach((v,i)=>{ ctx.fillStyle='#7f77dd'; ctx.fillRect(i*70+20, 180-v, 44, v); });
</script>
</body></html>`;

export function EmbedDialog() {
  const open = useStore((s) => s.embedDialogOpen);
  const setOpen = useStore((s) => s.setEmbedDialogOpen);
  const editor = useEditorInstance();
  const [mode, setMode] = useState<"url" | "code">("url");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState(CODE_TEMPLATE);
  const [height, setHeight] = useState(320);

  if (!open || !editor) return null;

  const insert = () => {
    if (mode === "url" && !url.trim()) return;
    editor.chain().focus().insertCodeEmbed({ mode, src: url.trim(), code, height }).run();
    setOpen(false);
  };

  const field: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Insert live embed"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <BarChart3 size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Insert live data / code</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "10px 16px 0" }}>
          <button onClick={() => setMode("url")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "9px 9px 0 0", fontSize: 13, fontWeight: 500, color: mode === "url" ? "var(--accent)" : "var(--text-secondary)", borderBottom: mode === "url" ? "2px solid var(--accent)" : "2px solid transparent" }}>
            <Globe size={15} /> Remote source
          </button>
          <button onClick={() => setMode("code")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "9px 9px 0 0", fontSize: 13, fontWeight: 500, color: mode === "code" ? "var(--accent)" : "var(--text-secondary)", borderBottom: mode === "code" ? "2px solid var(--accent)" : "2px solid transparent" }}>
            <Code2 size={15} /> Live code
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {mode === "url" ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>Embed URL — a live chart, table, or data visualization from a remote source.</div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/embed/chart" style={field} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {URL_EXAMPLES.map((ex) => (
                  <button key={ex.label} onClick={() => setUrl(ex.url)} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 7, border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-elev-2)" }}>{ex.label}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>HTML/JS rendered live in a sandboxed frame — charts, calculators, interactive widgets.</div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={9} style={{ ...field, fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical" }} />
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 12.5, color: "var(--text-secondary)" }}>
            Height
            <input type="range" min={160} max={640} step={20} value={height} onChange={(e) => setHeight(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--accent)" }} />
            <span style={{ width: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{height}px</span>
          </label>

          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10, lineHeight: 1.5 }}>
            Embeds run sandboxed. Some sites block framing; data/code from trusted sources renders inline.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button onClick={() => setOpen(false)} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}>Cancel</button>
            <button onClick={insert} style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 9, color: "var(--accent-contrast)", background: "var(--accent)" }}>Insert</button>
          </div>
        </div>
      </div>
    </div>
  );
}
