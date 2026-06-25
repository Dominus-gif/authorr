"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ChevronUp, ChevronDown, X, Replace, CaseSensitive } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

/** Floating Find & Replace panel. Drives the SearchReplace extension: matches
 *  are highlighted live in the document; prev/next scrolls through them. */
export function FindReplace() {
  const editor = useEditorInstance();
  const open = useStore((s) => s.findReplaceOpen);
  const setOpen = useStore((s) => s.setFindReplaceOpen);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [, force] = useReducer((x) => x + 1, 0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-render on editor transactions so match counts stay current.
  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", force);
    return () => {
      editor.off("transaction", force);
    };
  }, [editor]);

  // Push the query into the extension whenever it (or the case flag) changes.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(query, caseSensitive);
  }, [editor, query, caseSensitive]);

  // Focus the field when opened; clear highlights when closed.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      editor?.commands.clearSearch();
    }
  }, [open, editor]);

  if (!open || !editor) return null;

  const storage = editor.storage.searchReplace as { results: { from: number; to: number }[]; index: number };
  const total = storage.results.length;
  const current = total ? storage.index + 1 : 0;

  const go = (dir: number) => {
    if (!total) return;
    const next = (storage.index + dir + total) % total;
    editor.commands.setSearchIndex(next);
    const m = storage.results[next];
    if (m) editor.chain().setTextSelection({ from: m.from, to: m.to }).scrollIntoView().run();
  };

  const replaceOne = () => {
    if (!total) return;
    editor.chain().focus().replaceCurrent(replacement).run();
    editor.commands.setSearchTerm(query, caseSensitive);
  };

  const replaceAll = () => {
    if (!total) return;
    editor.chain().focus().replaceAllMatches(replacement).run();
    editor.commands.setSearchTerm(query, caseSensitive);
  };

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "6px 9px",
    borderRadius: 7,
    border: "1px solid var(--border-strong)",
    background: "var(--bg-elev)",
    color: "var(--text)",
    fontSize: 13,
  };
  const iconBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 7,
    color: "var(--text-secondary)",
    flexShrink: 0,
    ...extra,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 96,
        right: 26,
        zIndex: 90,
        width: 332,
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        padding: 10,
        boxShadow: "0 18px 44px rgba(0,0,0,0.42)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); go(e.shiftKey ? -1 : 1); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Find"
          style={fieldStyle}
        />
        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", minWidth: 42, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {current}/{total}
        </span>
        <button title="Match case" onMouseDown={(e) => { e.preventDefault(); setCaseSensitive((v) => !v); }} style={iconBtn(caseSensitive ? { color: "var(--accent)", background: "var(--accent-soft)" } : undefined)}>
          <CaseSensitive size={16} />
        </button>
        <button title="Previous (Shift+Enter)" onMouseDown={(e) => { e.preventDefault(); go(-1); }} style={iconBtn()} disabled={!total}>
          <ChevronUp size={16} />
        </button>
        <button title="Next (Enter)" onMouseDown={(e) => { e.preventDefault(); go(1); }} style={iconBtn()} disabled={!total}>
          <ChevronDown size={16} />
        </button>
        <button title="Close" onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} style={iconBtn()}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); replaceOne(); } if (e.key === "Escape") setOpen(false); }}
          placeholder="Replace with"
          style={fieldStyle}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); replaceOne(); }}
          disabled={!total}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, fontSize: 12.5, color: "var(--text-secondary)", border: "1px solid var(--border-strong)", opacity: total ? 1 : 0.5 }}
        >
          <Replace size={14} /> One
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); replaceAll(); }}
          disabled={!total}
          style={{ padding: "6px 10px", borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: "var(--accent-contrast)", background: "var(--accent)", opacity: total ? 1 : 0.5 }}
        >
          All
        </button>
      </div>
    </div>
  );
}
