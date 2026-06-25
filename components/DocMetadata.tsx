"use client";

import { Info, X, User as UserIcon, Users, Lock as LockIcon } from "lucide-react";
import { useStore, selectActiveDoc, collabEditsRemaining, PERSONAL_DAILY_COLLAB_LIMIT } from "@/lib/store";
import { STATUS_META, isTaskOpen } from "@/lib/types";

function fmt(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocMetadata() {
  const open = useStore((s) => s.metadataOpen);
  const setOpen = useStore((s) => s.setMetadataOpen);
  const doc = useStore(selectActiveDoc);
  const versions = useStore((s) => (doc ? s.versions[doc.id] : undefined));
  const editTasks = useStore((s) => s.editTasks);
  const edition = useStore((s) => s.edition);
  const setCollabMode = useStore((s) => s.setCollabMode);
  const isFree = useStore((s) => s.plan === "free");
  const requireFeature = useStore((s) => s.requireFeature);
  const remaining = useStore(collabEditsRemaining);

  if (!open || !doc) return null;
  const mode = doc.collabMode ?? "personal";

  const status = doc.status ?? "draft";
  const contributors = doc.contributors ?? [];
  const docTasks = editTasks.filter((t) => t.docId === doc.id);
  const openTasks = docTasks.filter((t) => isTaskOpen(t.status)).length;

  const rows: [string, React.ReactNode][] = [
    ["Document", doc.name],
    ["Status", <span key="s" style={{ color: STATUS_META[status].color }}>{STATUS_META[status].label}</span>],
    ["Creator", doc.creatorName ?? "—"],
    ["Created", fmt(doc.createdAt)],
    ["Last modified", fmt(doc.updatedAt)],
    ["Edits", (doc.editCount ?? 0).toLocaleString()],
    ["Versions", (versions?.length ?? 0).toLocaleString()],
    ["Edit requests", `${docTasks.length} (${openTasks} open)`],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Document metadata"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 100%)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
          <Info size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Document info</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "7px 0", color: "var(--text-tertiary)", width: 130, verticalAlign: "top" }}>{k}</td>
                  <td style={{ padding: "7px 0", color: "var(--text)", textAlign: "right" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Collaboration: Personal + Team only. On Free, Team is locked (Personal stays available). */}
          <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
              Collaboration mode
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["personal", "team"] as const).map((m) => {
                const active = mode === m;
                const locked = isFree && m === "team";
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (locked) { requireFeature("collaboration"); return; }
                      setCollabMode(doc.id, m);
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      padding: "8px 0",
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 500,
                      border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: active ? "var(--accent-soft)" : "var(--bg-elev-2)",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      opacity: locked ? 0.7 : 1,
                    }}
                  >
                    {m === "personal" ? <UserIcon size={14} /> : locked ? <LockIcon size={13} /> : <Users size={14} />}
                    {m === "personal" ? "Personal draft" : "Team workspace"}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.5 }}>
              {mode === "team"
                ? "Team edits stay separate from personal drafts and keep their own version history."
                : "Personal drafts are private to you and excluded from collaboration limits."}
              {mode === "team" && edition === "personal" && (
                <> · {remaining}/{PERSONAL_DAILY_COLLAB_LIMIT} collaborative edits left today.</>
              )}
            </p>
          </div>

          <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
              Contributors ({contributors.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {contributors.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>None yet.</span>
              )}
              {contributors.map((c) => (
                <span
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "4px 10px 4px 5px",
                    borderRadius: 999,
                    background: "var(--bg-elev-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.name.charAt(0)}
                  </span>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
