"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useEditorInstance } from "./EditorContext";

/** Reveals an anchored comment's content when hovering its marked text. */
export function CommentTooltip() {
  const editor = useEditorInstance();
  const [tip, setTip] = useState<{ x: number; y: number; text: string; author: string } | null>(null);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.("[data-comment-id]") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTip({
        x: r.left,
        y: r.bottom + 6,
        text: decodeURIComponent(el.getAttribute("data-comment") || ""),
        author: el.getAttribute("data-comment-by") || "",
      });
    };
    const onOut = (e: Event) => {
      if ((e.target as HTMLElement).closest?.("[data-comment-id]")) setTip(null);
    };
    dom.addEventListener("mouseover", onOver);
    dom.addEventListener("mouseout", onOut);
    return () => {
      dom.removeEventListener("mouseover", onOver);
      dom.removeEventListener("mouseout", onOut);
    };
  }, [editor]);

  if (!tip || !tip.text) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(tip.x, window.innerWidth - 290),
        top: Math.min(tip.y, window.innerHeight - 120),
        zIndex: 90,
        width: 270,
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <MessageSquare size={13} style={{ color: "var(--warning)" }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>{tip.author || "Comment"}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5 }}>{tip.text}</div>
    </div>
  );
}
