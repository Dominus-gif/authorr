"use client";

import { AtSign, X, History, Crosshair, Check, CheckCheck, Unlink, Archive, Pencil, Ban } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import { TASK_STATUS_META, isTaskOpen } from "@/lib/types";

export function RequestDetail() {
  const openTaskId = useStore((s) => s.openTaskId);
  const setOpenTask = useStore((s) => s.setOpenTask);
  const editTasks = useStore((s) => s.editTasks);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const setVersionHistoryOpen = useStore((s) => s.setVersionHistoryOpen);
  const currentUserId = useStore((s) => s.currentUserId);
  const activeDocId = useStore((s) => s.activeDocId);
  const showToast = useStore((s) => s.showToast);
  const editor = useEditorInstance();

  const task = editTasks.find((t) => t.id === openTaskId);

  // Is the task still anchored to text in the (active) document?
  let anchored = true;
  if (task && editor && task.docId === activeDocId) {
    anchored = false;
    editor.state.doc.descendants((node) => {
      if (anchored || !node.isText) return;
      if (node.marks.some((m) => m.type.name === "annotation" && m.attrs.taskId === task.id))
        anchored = true;
    });
  }
  const detached = !!task && task.docId === activeDocId && !anchored && isTaskOpen(task.status);

  if (!task) return null;

  const meta = TASK_STATUS_META[task.status];
  const canAct = currentUserId === task.assigneeId || currentUserId === task.requestedById;

  const reassign = () => {
    if (!editor || editor.state.selection.empty) {
      showToast("Select the new passage in the document first, then reassign.");
      return;
    }
    editor
      .chain()
      .focus()
      .setAnnotation({
        color: task.assigneeColor,
        by: task.requestedByName,
        assigned: true,
        taskId: task.id,
        initial: task.assigneeName.charAt(0).toUpperCase(),
      })
      .run();
    showToast(`Request re-anchored to the new selection.`);
    setOpenTask(null);
  };

  const selectTaskRange = () => {
    if (!editor) return false;
    let range: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (range || !node.isText) return;
      const m = node.marks.find(
        (mk) => mk.type.name === "annotation" && mk.attrs.taskId === task.id,
      );
      if (m) range = { from: pos, to: pos + node.nodeSize };
    });
    if (range) {
      editor.chain().focus().setTextSelection(range).scrollIntoView().run();
      // Clear 5-second spotlight on the actual marker element.
      const dom = (editor.view.dom as HTMLElement).querySelector(`span[data-task="${task.id}"]`);
      if (dom) {
        dom.classList.add("review-spotlight");
        setTimeout(() => dom.classList.remove("review-spotlight"), 5000);
      }
      return true;
    }
    return false;
  };

  const viewInContext = () => {
    selectTaskRange();
    setOpenTask(null);
  };

  const reject = () => {
    setTaskStatus(task.id, "rejected");
    setOpenTask(null);
  };

  // Accept ≠ done: move into "in progress" and highlight the target text so the
  // assignee can make the edit, then confirm later with "Changes made".
  const accept = () => {
    setTaskStatus(task.id, "in_progress");
    selectTaskRange();
    showToast(`Request #${task.ref} accepted — edit the highlighted text, then click “Changes made”.`);
    setOpenTask(null);
  };

  const changesMade = () => {
    setTaskStatus(task.id, "approved");
    showToast(`Request #${task.ref} marked complete.`);
    setOpenTask(null);
  };

  const approveReviewed = () => {
    setTaskStatus(task.id, "approved");
    showToast(`Request #${task.ref} approved.`);
    setOpenTask(null);
  };

  const showHistory = () => {
    setOpenTask(null);
    setVersionHistoryOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request details"
      onClick={() => setOpenTask(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
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
          width: "min(420px, 100%)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
          <AtSign size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {task.kind === "review" ? "Review request" : "Edit request"}
            <span style={{ color: "var(--text-tertiary)", marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>#{task.ref ?? "—"}</span>
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 9px",
              borderRadius: 999,
              color: meta.color,
              background: "var(--bg-elev-3)",
            }}
          >
            {meta.label}
          </span>
          <button onClick={() => setOpenTask(null)} aria-label="Close" style={{ color: "var(--text-secondary)", display: "flex" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: task.assigneeColor, color: "#16161a", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {task.assigneeName.charAt(0)}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{task.requestedByName}</span> asked{" "}
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{task.assigneeName}</span> to amend
            </span>
          </div>

          <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 10 }}>{task.note}</p>
          {task.excerpt && (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: 10, marginBottom: 14 }}>
              “{task.excerpt}”
            </p>
          )}

          {task.stale && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 12,
                marginBottom: 14,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>
                <Ban size={14} /> No longer available
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                The text this task targeted was changed or removed
                {task.staleBy ? <> by <span style={{ color: "var(--text)", fontWeight: 500 }}>{task.staleBy}</span></> : null}
                {task.staleAt ? ` · ${new Date(task.staleAt).toLocaleString()}` : ""}.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setTaskStatus(task.id, "rejected"); setOpenTask(null); }} style={btn()}>
                  <Archive size={14} /> Move to archive
                </button>
                {detached && (
                  <button onClick={reassign} style={{ ...btn(), color: "var(--accent)" }}>
                    <Crosshair size={14} /> Reassign to selection
                  </button>
                )}
              </div>
            </div>
          )}

          {detached && !task.stale && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 12,
                marginBottom: 14,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning) 40%, transparent)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--warning)", fontWeight: 500 }}>
                <Unlink size={14} /> Detached — the anchored text was removed
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Undo the deletion to auto-relink, or select new text and reassign.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reassign} style={{ ...btn(), color: "var(--accent)" }}>
                  <Crosshair size={14} /> Reassign to selection
                </button>
                <button onClick={() => { setTaskStatus(task.id, "rejected"); setOpenTask(null); }} style={btn()}>
                  <Archive size={14} /> Archive
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={viewInContext} style={btn()}>
              <Crosshair size={14} /> View in document
            </button>
            <button onClick={showHistory} style={btn()}>
              <History size={14} /> Show version history
            </button>
          </div>

          {canAct && isTaskOpen(task.status) && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {task.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={accept} style={{ ...btn(), color: "var(--success)" }}>
                    <Check size={14} /> Accept
                  </button>
                  <button onClick={reject} style={{ ...btn(), color: "var(--danger)" }}>
                    <Ban size={14} /> Reject
                  </button>
                  <button onClick={() => setTaskStatus(task.id, "needs_review")} style={{ ...btn(), color: "var(--accent)" }}>
                    <Pencil size={14} /> Needs changes
                  </button>
                </div>
              )}

              {task.status === "in_progress" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                    Accepted — edit the highlighted text, then confirm the change is done.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={changesMade} style={{ ...btn(), color: "var(--accent-contrast)", background: "var(--success)", border: "none" }}>
                      <CheckCheck size={14} /> Changes made
                    </button>
                    <button onClick={viewInContext} style={btn()}>
                      <Crosshair size={14} /> Re-highlight text
                    </button>
                    <button onClick={reject} style={{ ...btn(), color: "var(--danger)" }}>
                      <Ban size={14} /> Reject
                    </button>
                  </div>
                </div>
              )}

              {task.status === "needs_review" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={approveReviewed} style={{ ...btn(), color: "var(--success)" }}>
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={reject} style={{ ...btn(), color: "var(--danger)" }}>
                    <Ban size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 500,
    padding: "7px 12px",
    borderRadius: 9,
    border: "1px solid var(--border-strong)",
    color: "var(--text-secondary)",
  };
}
