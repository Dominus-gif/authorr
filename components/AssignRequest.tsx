"use client";

import { useState } from "react";
import { AtSign, UserCheck, X } from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

export function AssignRequest() {
  const req = useStore((s) => s.assignRequest);
  const setAssignRequest = useStore((s) => s.setAssignRequest);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const addEditTask = useStore((s) => s.addEditTask);
  const showToast = useStore((s) => s.showToast);
  const doc = useStore(selectActiveDoc);
  const editor = useEditorInstance();

  const me = users.find((u) => u.id === currentUserId);
  const assignees = users.filter((u) => u.id !== currentUserId);
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "");
  const [note, setNote] = useState("");

  if (!req) return null;

  const isReview = req.kind === "review";
  const assignee = users.find((u) => u.id === assigneeId);

  const submit = () => {
    if (!doc || !assignee) return;
    const taskId = addEditTask({
      docId: doc.id,
      kind: req.kind,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeColor: assignee.color,
      requestedById: me?.id ?? "",
      requestedByName: me?.name ?? "Author",
      note: note.trim() || (isReview ? "Please review this passage." : "Please review and amend this passage."),
      excerpt: req.excerpt.slice(0, 140),
    });
    if (editor) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: req.from, to: req.to })
        .setAnnotation({
          color: assignee.color,
          by: me?.name,
          assigned: true,
          taskId,
          initial: assignee.name.charAt(0).toUpperCase(),
        })
        .run();
    }
    showToast(`${isReview ? "Review" : "Edit"} request assigned to ${assignee.name}.`);
    setAssignRequest(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assign edit request"
      onClick={() => setAssignRequest(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 100%)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          {isReview ? <UserCheck size={16} color="var(--accent)" /> : <AtSign size={16} color="var(--accent)" />}
          <span style={{ fontSize: 14, fontWeight: 500 }}>{isReview ? "Request a review" : "Ask a user to amend"}</span>
          <button onClick={() => setAssignRequest(null)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              fontStyle: "italic",
              borderLeft: "3px solid var(--accent)",
              paddingLeft: 12,
              marginBottom: 16,
              maxHeight: 66,
              overflow: "hidden",
            }}
          >
            “{req.excerpt || "(selected passage)"}”
          </div>

          <label style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Assign to
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
            {assignees.map((u) => {
              const active = u.id === assigneeId;
              return (
                <button
                  key={u.id}
                  onClick={() => setAssigneeId(u.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 11px",
                    borderRadius: 999,
                    fontSize: 13,
                    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: active ? "var(--accent-soft)" : "var(--bg-elev-2)",
                    color: "var(--text)",
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: u.color }} />
                  {u.name}
                </button>
              );
            })}
          </div>

          <label style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should they change?"
            rows={3}
            style={{
              width: "100%",
              marginTop: 8,
              resize: "vertical",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 9,
              color: "var(--text)",
              padding: "9px 11px",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setAssignRequest(null)}
              style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 9, color: "var(--accent-contrast)", background: "var(--accent)" }}
            >
              Send request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
