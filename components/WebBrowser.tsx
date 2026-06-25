"use client";

import { useRef, useState } from "react";
import { Globe, X, ArrowRight, Sparkles, Copy, Check, CornerDownLeft, Loader2, GripVertical, RotateCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

interface KeyPoints {
  title: string;
  sentences: string[];
  sections: string[];
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) {
    if (/\s/.test(u) || !u.includes(".")) return `https://en.wikipedia.org/wiki/${encodeURIComponent(u.replace(/\s+/g, "_"))}`;
    u = "https://" + u;
  }
  return u;
}

/** Pull structured key points from a Wikipedia article via its CORS-enabled API. */
async function extractKeyPoints(url: string): Promise<KeyPoints> {
  const m = url.match(/\/\/(\w+)\.wikipedia\.org\/wiki\/([^#?]+)/);
  if (!m) throw new Error("Key-point extraction works on Wikipedia article pages. Open one, then extract.");
  const lang = m[1];
  const title = decodeURIComponent(m[2]);
  const base = `https://${lang}.wikipedia.org/w/api.php`;
  const introRes = await fetch(`${base}?action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
  const introJson = await introRes.json();
  const pages = introJson?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { title?: string; extract?: string } | undefined;
  const extract = page?.extract ?? "";
  if (!extract) throw new Error("Couldn't read that page's content.");
  const sentences = extract
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)
    .slice(0, 7);
  let sections: string[] = [];
  try {
    const secRes = await fetch(`${base}?action=parse&page=${encodeURIComponent(title)}&prop=sections&redirects=1&format=json&origin=*`);
    const secJson = await secRes.json();
    sections = (secJson?.parse?.sections ?? [])
      .filter((s: { toclevel: number }) => s.toclevel === 1)
      .map((s: { line: string }) => s.line)
      .slice(0, 8);
  } catch {
    /* sections are optional */
  }
  return { title: page?.title ?? title, sentences, sections };
}

/** The browser content (URL bar + iframe + key-point extraction). Reusable in
 *  the floating window AND the tabbed side panel. */
export function BrowserPane() {
  const editor = useEditorInstance();
  const [urlInput, setUrlInput] = useState("https://en.wikipedia.org/wiki/Artificial_intelligence");
  const [loadedUrl, setLoadedUrl] = useState("https://en.wikipedia.org/wiki/Artificial_intelligence");
  const [points, setPoints] = useState<KeyPoints | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const go = (u?: string) => {
    const next = normalizeUrl(u ?? urlInput);
    if (!next) return;
    setUrlInput(next);
    setLoadedUrl(next);
    setPoints(null);
    setError("");
  };

  const extract = async () => {
    setBusy(true);
    setError("");
    setPoints(null);
    try {
      setPoints(await extractKeyPoints(loadedUrl));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  };

  const pointsText = points ? `${points.title} — key points:\n${points.sentences.map((s) => `• ${s}`).join("\n")}${points.sections.length ? `\n\nSections: ${points.sections.join(", ")}` : ""}` : "";
  const copy = () => {
    navigator.clipboard?.writeText(pointsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const insert = () => {
    if (!editor || !points) return;
    editor.chain().focus().insertContent(`<p><strong>${points.title} — key points</strong></p><ul>${points.sentences.map((s) => `<li>${s}</li>`).join("")}</ul>`).run();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
          placeholder="Search Wikipedia or enter a URL"
          style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-mono)" }}
        />
        <button onClick={() => go()} title="Go" style={{ display: "flex", padding: 7, borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}><ArrowRight size={15} /></button>
        <button onClick={() => { if (iframeRef.current) iframeRef.current.src = loadedUrl; }} title="Reload" style={{ display: "flex", padding: 7, borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}><RotateCw size={14} /></button>
        <button onClick={extract} disabled={busy} title="Extract key points" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 8, background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 12, fontWeight: 500 }}>
          {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Key points
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0, background: "#fff" }}>
        <iframe
          ref={iframeRef}
          src={loadedUrl}
          title="Mini browser"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
        {points && (
          <div style={{ position: "absolute", inset: 0, background: "var(--bg-elev)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <Sparkles size={15} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Key points · {points.title}</span>
              <button onClick={() => setPoints(null)} style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                {points.sentences.map((s, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{s}</li>
                ))}
              </ul>
              {points.sections.length > 0 && (
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-tertiary)" }}>
                  <span style={{ fontWeight: 600 }}>Main sections:</span> {points.sections.join(" · ")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
              <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", color: copied ? "var(--success)" : "var(--text-secondary)" }}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={insert} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
                <CornerDownLeft size={14} /> Insert into document
              </button>
            </div>
          </div>
        )}
        {error && !points && (
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, fontSize: 12.5, color: "#fff", background: "var(--danger)", padding: "9px 12px", borderRadius: 9 }}>{error}</div>
        )}
      </div>
    </div>
  );
}

/** Floating draggable mini-browser window (TopBar Globe button). */
export function WebBrowser() {
  const open = useStore((s) => s.browserOpen);
  const setOpen = useStore((s) => s.setBrowserOpen);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  if (!open) return null;

  const onDragDown = (e: React.PointerEvent) => {
    const r = (e.currentTarget.closest("[data-browser-window]") as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) });
  };
  const onDragUp = () => { drag.current = null; };

  return (
    <div
      data-browser-window
      data-glass-panel
      style={{
        position: "fixed",
        ...(pos ? { left: pos.x, top: pos.y } : { right: 24, bottom: 24 }),
        zIndex: 95,
        width: 460,
        height: 580,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 32px)",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-elev)",
        border: "1px solid var(--border-strong)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid var(--border)", background: "var(--bg-elev-2)" }}>
        <span onPointerDown={onDragDown} onPointerMove={onDragMove} onPointerUp={onDragUp} title="Drag" style={{ cursor: "grab", color: "var(--text-tertiary)", display: "flex", touchAction: "none" }}>
          <GripVertical size={15} />
        </span>
        <Globe size={15} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Web browser</span>
        <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
          <X size={16} />
        </button>
      </div>
      <BrowserPane />
    </div>
  );
}
