"use client";

import { useMemo, useRef, useState } from "react";
import { diffWords } from "diff";
import { X, RotateCcw, Clock, History } from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import type { DocVersion } from "@/lib/types";

const EMPTY_VERSIONS: DocVersion[] = [];

/** Serialize document HTML to text PLUS bracketed tokens for non-text elements
 *  (images, tables, doodles, embeds, equations…) so that deleting one of them
 *  shows up as a removal in the word diff instead of silently disappearing. */
function textFromHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const parts: string[] = [];
  const walk = (node: Node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        parts.push(n.textContent || "");
        return;
      }
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      const e = n as HTMLElement;
      const tag = e.tagName.toLowerCase();
      if (tag === "img") {
        const alt = e.getAttribute("alt");
        parts.push(e.hasAttribute("data-drawing") || (e.parentElement?.hasAttribute("data-drawing")) ? " ⟦Doodle⟧ " : ` ⟦Image${alt ? ": " + alt : ""}⟧ `);
        return;
      }
      if (e.hasAttribute("data-drawing")) { parts.push(" ⟦Doodle⟧ "); return; }
      if (e.hasAttribute("data-embed")) { parts.push(` ⟦Embed⟧ `); return; }
      if (e.hasAttribute("data-signature")) { parts.push(" ⟦Signature⟧ "); return; }
      if (e.hasAttribute("data-math")) { parts.push(` ⟦Equation: ${e.getAttribute("data-latex") || ""}⟧ `); return; }
      if (tag === "hr") { parts.push(" ⟦Divider⟧ "); return; }
      if (tag === "br") { parts.push("\n"); return; }
      if (tag === "table") {
        const rows = e.querySelectorAll("tr").length;
        const cols = e.querySelector("tr")?.children.length ?? 0;
        parts.push(` ⟦Table ${rows}×${cols}⟧ `);
        walk(e);
        parts.push("\n");
        return;
      }
      walk(e);
      if (["p", "h1", "h2", "h3", "li", "blockquote", "pre", "figure"].includes(tag)) parts.push("\n");
    });
  };
  walk(root);
  return parts.join("").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function relTime(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleString();
}

export function VersionHistory({ onClose }: { onClose: () => void }) {
  const doc = useStore(selectActiveDoc);
  const versions = useStore((s) => (doc ? s.versions[doc.id] ?? EMPTY_VERSIONS : EMPTY_VERSIONS));
  const restoreVersion = useStore((s) => s.restoreVersion);
  const requestRestore = useStore((s) => s.requestRestore);
  const showToast = useStore((s) => s.showToast);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const editor = useEditorInstance();
  const isAuthor = users.find((u) => u.id === currentUserId)?.role === "author";
  const [selected, setSelected] = useState<string | null>(versions[0]?.id ?? null);

  const current = doc?.content ?? "";
  const selectedVersion: DocVersion | undefined = versions.find((v) => v.id === selected);

  const diff = useMemo(() => {
    if (!selectedVersion) return [];
    return diffWords(textFromHtml(selectedVersion.content), textFromHtml(current));
  }, [selectedVersion, current]);

  const diffScrollRef = useRef<HTMLDivElement>(null);
  const partRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Change markers for the rail: each added/removed part with its position ratio
  // through the diff text and a plain-text anchor to navigate the live doc.
  const changeMarks = useMemo(() => {
    const total = diff.reduce((n, p) => n + p.value.length, 0) || 1;
    const plains = diff.map((p) => p.value.replace(/⟦[^⟧]*⟧/g, " ").replace(/\s+/g, " ").trim());
    let offset = 0;
    const marks: { index: number; type: "add" | "del"; ratio: number; anchor: string }[] = [];
    diff.forEach((part, i) => {
      if (part.added || part.removed) {
        let anchor = "";
        if (part.added) {
          anchor = plains[i].slice(0, 60);
        } else {
          // Deleted text is gone from the live doc — anchor on the nearest
          // unchanged text (preceding first, then following) so we can still
          // jump to where the change was.
          let prev = "";
          for (let j = i - 1; j >= 0 && !prev; j--) if (!diff[j].added && !diff[j].removed) prev = plains[j].slice(-60);
          let next = "";
          for (let j = i + 1; j < diff.length && !next; j++) if (!diff[j].added && !diff[j].removed) next = plains[j].slice(0, 60);
          anchor = (prev || next).trim();
        }
        marks.push({ index: i, type: part.added ? "add" : "del", ratio: offset / total, anchor });
      }
      offset += part.value.length;
    });
    return marks;
  }, [diff]);

  // Jump within the diff view to a change.
  const scrollDiffTo = (index: number) => {
    partRefs.current[index]?.scrollIntoView({ block: "center", behavior: "smooth" });
    const el = partRefs.current[index];
    if (el) { el.classList.add("diff-flash"); setTimeout(() => el.classList.remove("diff-flash"), 1200); }
  };

  // Click a change → scroll the live document to it (closes the panel) + spotlight.
  // Matches against a FLATTENED doc (text nodes concatenated with a position map)
  // so anchors that span multiple text nodes — e.g. across bold/italic marks —
  // still resolve, instead of silently failing on a single-node indexOf.
  const goToDoc = (anchor: string) => {
    if (!editor) return onClose();
    const words = anchor
      .replace(/⟦[^⟧]*⟧/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .slice(0, 6);
    if (words.length === 0) return onClose();

    // Build flattened text + a char→ProseMirror-position map.
    let flat = "";
    const map: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        for (let k = 0; k < node.text.length; k++) {
          flat += node.text[k];
          map.push(pos + k);
        }
      }
    });

    const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let from = -1;
    let to = -1;
    // Try the whole phrase (whitespace-flexible), then fall back to the longest word.
    const phrase = new RegExp(words.map(esc).join("\\s+"), "iu");
    const m = phrase.exec(flat);
    if (m) {
      from = map[m.index];
      to = map[Math.min(m.index + m[0].length - 1, map.length - 1)] + 1;
    } else {
      for (const w of [...words].sort((a, b) => b.length - a.length)) {
        const i = flat.toLowerCase().indexOf(w.toLowerCase());
        if (i >= 0) {
          from = map[i];
          to = map[i + w.length - 1] + 1;
          break;
        }
      }
    }

    if (from < 0) return onClose();
    onClose();
    // Select + instant-scroll to the change, then drop a temporary highlight
    // OVERLAY inside the scrolling content wrapper. An overlay (rather than a
    // class on a ProseMirror-managed node, which PM reconciles away) reliably
    // renders the "clear highlight" and tracks the text as the page scrolls.
    requestAnimationFrame(() => {
      try {
        editor.chain().setTextSelection({ from, to }).scrollIntoView().run();
      } catch {
        /* ignore */
      }
      requestAnimationFrame(() => {
        let c1, c2;
        try {
          c1 = editor.view.coordsAtPos(from);
          c2 = editor.view.coordsAtPos(to);
        } catch {
          return;
        }
        const scope = document.querySelector("[data-doodle-scope]") as HTMLElement | null;
        if (!scope) return;
        const sr = scope.getBoundingClientRect();
        const sameLine = Math.abs(c1.top - c2.top) < 4;
        const top = Math.min(c1.top, c2.top) - sr.top - 2;
        const height = Math.max(c1.bottom, c2.bottom) - Math.min(c1.top, c2.top) + 4;
        const left = (sameLine ? c1.left : sr.left + 6) - sr.left - 2;
        const width = (sameLine ? c2.right - c1.left : sr.width - 12) + 4;
        const ov = document.createElement("div");
        ov.className = "review-spotlight-overlay";
        Object.assign(ov.style, {
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: `${Math.max(12, width)}px`,
          height: `${height}px`,
          pointerEvents: "none",
          zIndex: "5",
        });
        scope.appendChild(ov);
        setTimeout(() => ov.remove(), 5000);
      });
    });
  };

  const restore = () => {
    if (!doc || !selectedVersion) return;
    if (isAuthor) {
      const html = restoreVersion(doc.id, selectedVersion.id);
      if (html && editor) editor.commands.setContent(html, { emitUpdate: false });
    } else {
      // Non-authors can't overwrite the live doc — send for author approval.
      requestRestore(doc.id, selectedVersion.id, relTime(selectedVersion.ts));
      showToast("Restore request sent to the author for approval.");
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Version history"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(940px, 100%)",
          height: "min(640px, 90vh)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <History size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Version history</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {doc?.name}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Timeline */}
          <div
            style={{
              width: 256,
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              overflowY: "auto",
              padding: 8,
            }}
          >
            {versions.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", padding: 12 }}>
                No snapshots yet. Keep writing — versions are captured
                automatically.
              </p>
            )}
            {versions.map((v, i) => {
              const active = v.id === selected;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 11px",
                    borderRadius: 9,
                    marginBottom: 2,
                    background: active ? "var(--accent-soft)" : "transparent",
                    border: active ? "1px solid var(--accent)" : "1px solid transparent",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {i === 0 ? "Latest" : relTime(v.ts)}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", paddingLeft: 18 }}>
                    {new Date(v.ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {v.words.toLocaleString()} words
                  </span>
                  {v.author && (
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: 18 }}>
                      by {v.author.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Diff */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 18px",
                borderBottom: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--text-tertiary)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--success) 35%, transparent)" }} />
                additions
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--danger) 35%, transparent)" }} />
                deletions
              </span>
              <span style={{ marginLeft: "auto" }}>vs current draft</span>
            </div>

            <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
              <div
                ref={diffScrollRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "18px 22px",
                  fontFamily: "var(--font-reading)",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedVersion ? (
                  diff.length ? (
                    diff.map((part, i) => {
                      const changed = part.added || part.removed;
                      return (
                        <span
                          key={i}
                          ref={changed ? (el) => { partRefs.current[i] = el; } : undefined}
                          onClick={changed ? () => goToDoc(part.added ? part.value : (changeMarks.find((m) => m.index === i)?.anchor ?? "")) : undefined}
                          title={changed ? "Jump to this change in the document" : undefined}
                          style={{
                            background: part.added
                              ? "color-mix(in srgb, var(--success) 22%, transparent)"
                              : part.removed
                                ? "color-mix(in srgb, var(--danger) 20%, transparent)"
                                : "transparent",
                            color: part.added ? "var(--success)" : part.removed ? "var(--danger)" : "var(--text)",
                            textDecoration: part.removed ? "line-through" : "none",
                            borderRadius: 3,
                            cursor: changed ? "pointer" : "default",
                          }}
                        >
                          {part.value}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>No differences from the current draft.</span>
                  )
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>Select a version to compare.</span>
                )}
              </div>

              {/* Change rail — where additions/deletions sit across the document */}
              {changeMarks.length > 0 && (
                <div style={{ width: 12, flexShrink: 0, position: "relative", borderLeft: "1px solid var(--border)" }} title="Changes across the document">
                  {changeMarks.map((m) => (
                    <button
                      key={m.index}
                      onClick={() => goToDoc(m.anchor)}
                      onMouseEnter={() => scrollDiffTo(m.index)}
                      title={m.type === "add" ? "Addition — click to jump to it in the document" : "Deletion — click to jump to where it was"}
                      style={{
                        position: "absolute",
                        top: `${Math.min(98, m.ratio * 100)}%`,
                        left: 1,
                        width: 9,
                        height: 4,
                        borderRadius: 2,
                        border: "none",
                        cursor: "pointer",
                        background: m.type === "add" ? "var(--success)" : "var(--danger)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                padding: "12px 18px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                onClick={onClose}
                style={{
                  fontSize: 13,
                  padding: "8px 14px",
                  borderRadius: 9,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                Close
              </button>
              <button
                onClick={restore}
                disabled={!selectedVersion}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: 9,
                  color: "var(--accent-contrast)",
                  background: selectedVersion ? "var(--accent)" : "var(--bg-elev-3)",
                }}
              >
                <RotateCcw size={14} />
                {isAuthor ? "Restore this version" : "Request restore"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
