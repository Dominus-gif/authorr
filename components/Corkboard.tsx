"use client";

import { LayoutGrid, X, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TreeNode } from "@/lib/types";

function flattenDocs(nodes: TreeNode[], acc: TreeNode[] = []): TreeNode[] {
  for (const n of nodes) {
    if (n.type === "doc") acc.push(n);
    if (n.children) flattenDocs(n.children, acc);
  }
  return acc;
}

function excerpt(html: string | undefined): string {
  if (!html) return "Empty card — no content yet.";
  const el = document.createElement("div");
  el.innerHTML = html;
  const t = (el.textContent || "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 160) : "Empty card — no content yet.";
}

/** Scrivener-style corkboard: each section as an index card with a short
 *  abstract. Click a card to open that section. */
export function Corkboard() {
  const open = useStore((s) => s.corkboardOpen);
  const setOpen = useStore((s) => s.setCorkboardOpen);
  const tree = useStore((s) => s.tree);
  const activeDocId = useStore((s) => s.activeDocId);
  const setActiveDoc = useStore((s) => s.setActiveDoc);

  if (!open) return null;
  const cards = flattenDocs(tree);

  return (
    <div
      role="dialog"
      aria-label="Corkboard"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <LayoutGrid size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Corkboard</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{cards.length} cards · click to open</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, alignContent: "start" }}>
          {cards.map((c) => {
            const active = c.id === activeDocId;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveDoc(c.id); setOpen(false); }}
                style={{
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  height: 170,
                  padding: 14,
                  borderRadius: 10,
                  background: "var(--bg-elev-2)",
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border-strong)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                  <FileText size={13} style={{ color: c.color || "var(--text-tertiary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden" }}>{excerpt(c.content)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
