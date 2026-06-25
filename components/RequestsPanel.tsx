"use client";

import { useState } from "react";
import { Inbox, Check, X, AtSign, Clock, RotateCcw, GitBranch, UserCheck, KeyRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { TASK_STATUS_META, isTaskOpen, type EditTask, type TaskStatus } from "@/lib/types";
import { RequestsTimeline } from "./RequestsTimeline";

function relTime(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

function elapsed(from: number): string {
  const s = Math.round((Date.now() - from) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

type Tab = "pending" | "needs_review" | "approved";
const TABS: { id: Tab; label: string; match: (s: EditTask["status"]) => boolean }[] = [
  { id: "pending", label: "Pending", match: (s) => s === "pending" || s === "in_progress" },
  { id: "needs_review", label: "Requires review", match: (s) => s === "needs_review" },
  { id: "approved", label: "Approved", match: (s) => s === "approved" },
];

export function RequestsPanel({ onClose }: { onClose: () => void }) {
  const editTasks = useStore((s) => s.editTasks);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const setOpenTask = useStore((s) => s.setOpenTask);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const restoreRequests = useStore((s) => s.restoreRequests);
  const resolveRestoreRequest = useStore((s) => s.resolveRestoreRequest);
  const accessRequests = useStore((s) => s.accessRequests);
  const resolveAccessRequest = useStore((s) => s.resolveAccessRequest);
  const me = users.find((u) => u.id === currentUserId);
  const isAuthor = me?.role === "author";
  const [tab, setTab] = useState<Tab>("pending");
  const [showAll, setShowAll] = useState(false);
  const pendingRestores = isAuthor
    ? restoreRequests.filter((r) => r.status === "pending")
    : [];
  const pendingAccess = isAuthor
    ? accessRequests.filter((r) => r.status === "pending")
    : [];

  const mine = editTasks.filter((t) =>
    isAuthor ? t.requestedById === currentUserId : t.assigneeId === currentUserId,
  );
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const visible = mine.filter((t) => activeTab.match(t.status));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit requests"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "clamp(8px, 6vh, 60px) clamp(8px, 2vw, 16px) 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(400px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 88px)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Inbox size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Edit requests</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {isAuthor ? "assigned by you" : "assigned to you"}
          </span>
          <button
            onClick={() => setShowAll(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
          >
            <GitBranch size={13} /> Show all
          </button>
          <button onClick={onClose} aria-label="Close" style={{ color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {showAll && <RequestsTimeline tasks={mine} onClose={() => setShowAll(false)} />}

        <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const n = mine.filter((x) => t.match(x.status)).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: "1 0 auto",
                  whiteSpace: "nowrap",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "6px 10px",
                  borderRadius: 8,
                  color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
                  background: active ? "var(--accent)" : "transparent",
                }}
              >
                {t.label} {n > 0 && <span style={{ opacity: 0.8 }}>({n})</span>}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 10 }}>
          {pendingAccess.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, margin: "2px 4px 8px" }}>
                Access requests
              </div>
              {pendingAccess.map((r) => (
                <div key={r.id} style={{ padding: 12, borderRadius: 11, border: "1px solid var(--accent)", background: "var(--accent-soft)", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, marginBottom: 6 }}>
                    <KeyRound size={13} style={{ color: "var(--accent)" }} />
                    <span style={{ color: "var(--text)" }}>
                      <span style={{ fontWeight: 500 }}>{r.requesterName}</span> wants edit access
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>“{r.docName}”</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => resolveAccessRequest(r.id, true)} style={smallBtn("var(--success)")}>
                      <Check size={12} /> Accept
                    </button>
                    <button onClick={() => resolveAccessRequest(r.id, false)} style={smallBtn("var(--danger)")}>
                      <X size={12} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingRestores.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4, margin: "2px 4px 8px" }}>
                Restore approvals
              </div>
              {pendingRestores.map((r) => (
                <div
                  key={r.id}
                  style={{ padding: 12, borderRadius: 11, border: "1px solid var(--border-info, var(--accent))", background: "var(--accent-soft)", marginBottom: 8 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, marginBottom: 6 }}>
                    <RotateCcw size={13} style={{ color: "var(--accent)" }} />
                    <span style={{ color: "var(--text)" }}>
                      <span style={{ fontWeight: 500 }}>{r.requestedByName}</span> wants to restore
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                    “{r.docName}” → version {r.versionLabel}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => resolveRestoreRequest(r.id, true)} style={smallBtn("var(--success)")}>
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => resolveRestoreRequest(r.id, false)} style={smallBtn("var(--danger)")}>
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {visible.length === 0 && pendingRestores.length === 0 && pendingAccess.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 16, textAlign: "center" }}>
              Nothing here. Select text and choose “Ask @user to amend” to create a request.
            </p>
          )}
          {visible.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              isAuthor={!!isAuthor}
              onOpen={() => {
                setOpenTask(t.id);
                onClose();
              }}
              onAccept={() => setTaskStatus(t.id, "approved")}
              onReject={() => setTaskStatus(t.id, "rejected")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isAuthor,
  onOpen,
  onAccept,
  onReject,
}: {
  task: EditTask;
  isAuthor: boolean;
  onOpen: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const meta = TASK_STATUS_META[task.status as TaskStatus];
  const open = isTaskOpen(task.status);
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 11,
        border: "1px solid var(--border)",
        background: "var(--bg-elev-2)",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, marginBottom: 6 }}>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: task.assigneeColor, color: "#16161a", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(isAuthor ? task.assigneeName : task.requestedByName).charAt(0)}
        </span>
        <span style={{ fontWeight: 600, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>#{task.ref ?? "—"}</span>
        <span style={{ fontWeight: 500, color: "var(--text)" }}>
          {isAuthor ? task.assigneeName : task.requestedByName}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-tertiary)" }}>
          {task.kind === "review" ? <UserCheck size={11} /> : <AtSign size={11} />}
          {task.kind === "review" ? "Review" : "Amend"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 500, padding: "1px 7px", borderRadius: 999, color: meta.color, background: "var(--bg-elev-3)" }}>
          {meta.label}
        </span>
      </div>

      <button onClick={onOpen} style={{ display: "block", textAlign: "left", width: "100%" }}>
        <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 6 }}>{task.note}</p>
        {task.excerpt && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: 8, marginBottom: 8 }}>
            “{task.excerpt}”
          </p>
        )}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} /> {relTime(task.ts)}
        </span>
        {task.startedAt && open && <span>· active {elapsed(task.startedAt)}</span>}
      </div>

      {open && (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onAccept} style={smallBtn("var(--success)")}>
            <Check size={12} /> Accept
          </button>
          <button onClick={onReject} style={smallBtn("var(--danger)")}>
            <X size={12} /> Reject
          </button>
          <button onClick={onOpen} style={smallBtn("var(--text-secondary)")}>
            Open
          </button>
        </div>
      )}
    </div>
  );
}

function smallBtn(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 11px",
    borderRadius: 8,
    border: "1px solid var(--border-strong)",
    color,
  };
}
