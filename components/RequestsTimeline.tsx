"use client";

import { GitBranch, X, AtSign, UserCheck } from "lucide-react";
import { TASK_STATUS_META, type EditTask, type TaskStatus } from "@/lib/types";

const GROUPS: { status: TaskStatus | "open"; label: string; match: (s: TaskStatus) => boolean }[] = [
  { status: "pending", label: "Pending", match: (s) => s === "pending" || s === "in_progress" },
  { status: "needs_review", label: "Requires review", match: (s) => s === "needs_review" },
  { status: "approved", label: "Approved", match: (s) => s === "approved" },
  { status: "rejected", label: "Rejected", match: (s) => s === "rejected" },
];

function fmt(ts: number): string {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function RequestsTimeline({ tasks, onClose }: { tasks: EditTask[]; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All requests"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(820px, 100%)", height: "min(660px, 90vh)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <GitBranch size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Request history</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{tasks.length} total</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px 20px" }}>
          {tasks.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 24, textAlign: "center" }}>No requests yet.</p>
          )}

          {/* Archived amendments — tasks rendered unavailable by a later edit. */}
          {tasks.some((t) => t.stale) && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
                <span style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-secondary)" }}>Archived · unavailable</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{tasks.filter((t) => t.stale).length}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 3, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.filter((t) => t.stale).sort((a, b) => (b.staleAt ?? 0) - (a.staleAt ?? 0)).map((t) => (
                  <div key={t.id} style={{ position: "relative", padding: 12, borderRadius: 11, border: "1px solid color-mix(in srgb, var(--danger) 30%, var(--border))", background: "var(--bg-elev-2)" }}>
                    <span style={{ position: "absolute", left: -23, top: 16, width: 9, height: 9, borderRadius: "50%", background: "var(--danger)", boxShadow: "0 0 0 3px var(--bg-elev)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>#{t.ref ?? "—"}</span>
                      <span style={{ fontSize: 12, color: "var(--text)" }}>{t.requestedByName} → {t.assigneeName}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>{t.staleAt ? fmt(t.staleAt) : ""}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 6 }}>{t.note}</p>
                    {t.excerpt && (
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: 9, marginBottom: 6 }}>“{t.excerpt}”</p>
                    )}
                    <div style={{ fontSize: 12, color: "var(--danger)" }}>
                      No longer available — original text amended{t.staleBy ? <> by <span style={{ fontWeight: 600 }}>{t.staleBy}</span></> : ""}.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {GROUPS.map((g) => {
            const items = tasks.filter((t) => g.match(t.status)).sort((a, b) => b.ts - a.ts);
            if (items.length === 0) return null;
            const meta = TASK_STATUS_META[g.status as TaskStatus];
            return (
              <div key={g.label} style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
                  <span style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-secondary)" }}>
                    {g.label}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{items.length}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 3, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((t) => (
                    <div key={t.id} style={{ position: "relative", padding: 12, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }}>
                      <span style={{ position: "absolute", left: -23, top: 16, width: 9, height: 9, borderRadius: "50%", background: meta.color, boxShadow: "0 0 0 3px var(--bg-elev)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "var(--bg-elev-3)", color: "var(--accent)" }}>
                          {t.kind === "review" ? <UserCheck size={12} /> : <AtSign size={12} />}
                          {t.kind === "review" ? "Review" : "Amend"}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, color: meta.color, background: "var(--bg-elev-3)" }}>
                          {TASK_STATUS_META[t.status].label}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text)" }}>
                          {t.requestedByName} → {t.assigneeName}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>{fmt(t.ts)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 3 }}>Requested change</div>
                      <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 8 }}>{t.note}</p>
                      {t.excerpt && (
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: 9, marginBottom: 8 }}>
                          “{t.excerpt}”
                        </p>
                      )}
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                        Outcome:{" "}
                        <span style={{ color: meta.color }}>
                          {t.status === "approved" ? "Accepted & applied" : t.status === "rejected" ? "Rejected" : t.status === "needs_review" ? "Sent back for changes" : "Awaiting action"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
