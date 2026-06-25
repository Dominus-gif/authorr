"use client";

import { useState } from "react";
import { Languages, X, Copy, Check, CornerDownLeft, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

/** Top 10 languages for global work/business (by usage). */
const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
];

/** Split into <=450-char chunks at sentence/space boundaries (MyMemory cap). */
function chunk(text: string, max = 450): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(". ", max);
    if (cut < max * 0.5) cut = rest.lastIndexOf(" ", max);
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest.trim()) parts.push(rest);
  return parts;
}

async function translateText(text: string, source: string, target: string): Promise<string> {
  const chunks = chunk(text);
  const out: string[] = [];
  for (const c of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=${source}|${target}`;
    const res = await fetch(url);
    const json = await res.json().catch(() => null);
    const text = json?.responseData?.translatedText ?? "";
    if (!res.ok || /MYMEMORY WARNING|YOU USED ALL AVAILABLE/i.test(text)) {
      throw new Error(
        /YOU USED ALL AVAILABLE/i.test(text)
          ? "The free translation quota for today has been reached. Please try again later."
          : `Translation service error (${res.status}).`,
      );
    }
    out.push(text);
  }
  return out.join("");
}

export function TranslatePanel() {
  const open = useStore((s) => s.translateOpen);
  const setOpen = useStore((s) => s.setTranslateOpen);
  const editor = useEditorInstance();
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("es");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open || !editor) return null;

  const selText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
  const scope = selText.trim() ? selText : editor.getText();

  const run = async () => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const t = await translateText(scope, source, target);
      setResult(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const insert = () => {
    editor.chain().focus().insertContentAt(editor.state.selection.to, `\n${result}`).run();
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Translate document"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Languages size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Translate {selText.trim() ? "selection" : "document"}</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <Lang label="From" value={source} onChange={setSource} />
            <span style={{ color: "var(--text-tertiary)", marginTop: 18 }}>→</span>
            <Lang label="To" value={target} onChange={setTarget} />
            <button
              onClick={run}
              disabled={busy}
              style={{ marginLeft: "auto", marginTop: 18, padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500, background: "var(--accent)", color: "var(--accent-contrast)", display: "flex", alignItems: "center", gap: 7, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <Loader2 size={15} className="spin" /> : <Languages size={15} />} Translate
            </button>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 10 }}>
            {scope.length.toLocaleString()} characters · uses the free MyMemory translation API.
          </div>

          {error && <div style={{ fontSize: 12.5, color: "var(--danger)", padding: "10px 12px", borderRadius: 9, background: "color-mix(in srgb, var(--danger) 12%, transparent)", marginBottom: 12 }}>{error}</div>}

          <div style={{ minHeight: 120, padding: 12, borderRadius: 10, background: "var(--bg-elev-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {result || <span style={{ color: "var(--text-tertiary)" }}>Translation appears here…</span>}
          </div>

          {result && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", color: copied ? "var(--success)" : "var(--text-secondary)" }}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={insert} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
                <CornerDownLeft size={14} /> Insert into document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Lang({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--text-tertiary)" }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "7px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", fontSize: 13 }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
    </label>
  );
}
