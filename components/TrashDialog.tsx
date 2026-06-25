"use client";

import { Trash2, X, RotateCcw, FolderClosed, FileText, History } from "lucide-react";
import { useStore } from "@/lib/store";

export function TrashDialog() {
  const open = useStore((s) => s.trashOpen);
  const setOpen = useStore((s) => s.setTrashOpen);
  const trash = useStore((s) => s.trash);
  const restore = useStore((s) => s.restoreFromTrash);
  const purge = useStore((s) => s.permanentDelete);
  const showToast = useStore((s) => s.showToast);

  if (!open) return null;
  const daysLeft = (deletedAt: number) => Math.max(0, 30 - Math.floor((Date.now() - deletedAt) / 86400000));

  return (
    <div role="dialog" aria-modal="true" aria-label="Trash" onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <Trash2 size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Trash</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>kept 30 days, then removed</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12 }}>
          {trash.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 28, textAlign: "center" }}>Trash is empty. Deleted documents and folders appear here for 30 days.</p>
          ) : (
            trash.map((item) => (
              <div key={item.node.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev-2)", marginBottom: 8 }}>
                <span style={{ color: item.node.color || "var(--text-tertiary)", display: "flex", flexShrink: 0 }}>
                  {item.node.type === "folder" ? <FolderClosed size={16} /> : <FileText size={16} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.node.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                    <span>· {daysLeft(item.deletedAt)} day{daysLeft(item.deletedAt) === 1 ? "" : "s"} left</span>
                    {item.versions.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><History size={11} /> {item.versions.length} version{item.versions.length === 1 ? "" : "s"}</span>}
                  </div>
                </div>
                <button
                  onClick={() => { restore(item.node.id); showToast(`Restored “${item.node.name}”${item.versions.length ? " with version history" : ""}.`); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, padding: "6px 11px", borderRadius: 8, color: "var(--accent)", border: "1px solid var(--accent)" }}
                >
                  <RotateCcw size={13} /> Restore
                </button>
                <button onClick={() => purge(item.node.id)} title="Delete permanently" style={{ display: "flex", padding: 6, color: "var(--text-tertiary)" }}><X size={15} /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
