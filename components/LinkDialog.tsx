"use client";

import { useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

/** Link editor with a custom display-text field (so links can read as friendly
 *  text instead of the raw URL). Prefills from the current selection / link. */
export function LinkDialog() {
  const open = useStore((s) => s.linkDialogOpen);
  const setOpen = useStore((s) => s.setLinkDialogOpen);
  const editor = useEditorInstance();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("https://");

  // Prefill when opening: existing href + the selected text.
  useEffect(() => {
    if (!open || !editor) return;
    const href = (editor.getAttributes("link").href as string | undefined) ?? "";
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ");
    setUrl(href || "https://");
    setText(selected);
  }, [open, editor]);

  if (!open || !editor) return null;

  const close = () => setOpen(false);

  const apply = () => {
    const href = url.trim();
    const label = text.trim();
    if (!href || href === "https://") { editor.chain().focus().unsetLink().run(); close(); return; }
    const safe = /^(https?:|mailto:|tel:|#|\/)/i.test(href) ? href : `https://${href}`;
    const { empty } = editor.state.selection;
    if (empty) {
      // No selection — insert linked text (display text, falling back to the URL).
      editor.chain().focus().insertContent(`<a href="${safe}">${escapeHtml(label || safe)}</a>`).run();
    } else if (label) {
      // Replace the selection with the custom text, carrying the link mark.
      editor.chain().focus().insertContent(`<a href="${safe}">${escapeHtml(label)}</a>`).run();
    } else {
      // Keep the selected text, just link it.
      editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
    }
    close();
  };

  const input: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none" };

  return (
    <div role="dialog" aria-modal="true" aria-label="Add link" onClick={close} style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Link2 size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add link</span>
          <button onClick={close} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Display text</span>
            <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. our pricing page" style={input}
              onKeyDown={(e) => { if (e.key === "Enter") apply(); }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" style={{ ...input, fontFamily: "var(--font-mono)" }}
              onKeyDown={(e) => { if (e.key === "Enter") apply(); }} />
          </label>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
            Leave the URL empty to remove the link. Display text shows instead of the raw URL.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={close} style={{ flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}>Cancel</button>
            <button onClick={apply} style={{ flex: 1.3, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "var(--accent-contrast)", background: "var(--accent)" }}>Apply link</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
