"use client";

import { useEffect, useReducer } from "react";
import { ListTree, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

interface Head {
  level: number;
  text: string;
  pos: number;
}

/** Auto-generated Table of Contents / document index. Lists every heading;
 *  clicking one scrolls the editor straight to it. */
export function DocOutline() {
  const open = useStore((s) => s.outlineOpen);
  const setOpen = useStore((s) => s.setOutlineOpen);
  const editor = useEditorInstance();
  const [, bump] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", bump);
    return () => { editor.off("transaction", bump); };
  }, [editor]);

  if (!open || !editor) return null;

  const heads: Head[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      heads.push({ level: (node.attrs.level as number) ?? 1, text: node.textContent || "Untitled", pos });
    }
  });

  const goTo = (pos: number) => {
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
    const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
    if (dom) {
      dom.classList.add("review-spotlight");
      setTimeout(() => dom.classList.remove("review-spotlight"), 1600);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 96,
        right: 26,
        zIndex: 88,
        width: 280,
        maxHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        boxShadow: "0 18px 44px rgba(0,0,0,0.42)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderBottom: "1px solid var(--border)" }}>
        <ListTree size={15} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Document outline</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{heads.length}</span>
        <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ overflowY: "auto", padding: 6 }}>
        {heads.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", padding: 14, textAlign: "center" }}>
            No headings yet. Add H1–H3 headings and they'll appear here for navigation.
          </p>
        ) : (
          heads.map((h, i) => (
            <button
              key={i}
              onClick={() => goTo(h.pos)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 9px",
                paddingLeft: 9 + (h.level - 1) * 14,
                borderRadius: 7,
                fontSize: h.level === 1 ? 13 : 12.5,
                fontWeight: h.level === 1 ? 600 : 400,
                color: h.level === 1 ? "var(--text)" : "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {h.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
