"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { MessageSquare, UserCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

const COMMENT_COLOR = "#3b9ad9";

interface Tick {
  kind: "task" | "comment";
  id: string;
  ratio: number; // 0..1 of content height
  color: string;
  cText?: string;
  cAuthor?: string;
}

/** Static review-marker strip — a fixed side panel (NOT inside the scroller, so
 *  markers never scroll away) that mirrors the position of every review/edit
 *  marker AND every anchored comment. Hover shows context; click jumps. */
export function ScrollMarkers() {
  const editor = useEditorInstance();
  const editTasks = useStore((s) => s.editTasks);
  const setOpenTask = useStore((s) => s.setOpenTask);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [rect, setRect] = useState<{ top: number; right: number; height: number } | null>(null);
  const [hover, setHover] = useState<{ id: string; y: number } | null>(null);
  const [, bump] = useReducer((x) => x + 1, 0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTip = (id: string, y: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHover({ id, y });
  };
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHover(null), 3000);
  };
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  useEffect(() => {
    setScroller(document.querySelector("[data-editor-scroll]") as HTMLElement | null);
  }, [editor]);

  useEffect(() => {
    if (!editor || !scroller) return;
    const recompute = () => {
      const sRect = scroller.getBoundingClientRect();
      setRect({ top: sRect.top, right: window.innerWidth - sRect.right, height: sRect.height });
      const seen = new Set<string>();
      const list: Tick[] = [];
      const ratioOf = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const offset = r.top - sRect.top + scroller.scrollTop;
        return Math.min(0.99, Math.max(0.005, offset / Math.max(scroller.scrollHeight, 1)));
      };
      // Review / edit-request markers
      scroller.querySelectorAll<HTMLElement>(".ProseMirror span[data-task]").forEach((el) => {
        const id = el.getAttribute("data-task");
        if (!id || seen.has("t:" + id)) return;
        seen.add("t:" + id);
        list.push({ kind: "task", id, ratio: ratioOf(el), color: el.getAttribute("data-color") || "var(--accent)" });
      });
      // Anchored comments
      scroller.querySelectorAll<HTMLElement>(".ProseMirror span[data-comment-id]").forEach((el) => {
        const id = el.getAttribute("data-comment-id");
        if (!id || seen.has("c:" + id)) return;
        seen.add("c:" + id);
        list.push({
          kind: "comment",
          id,
          ratio: ratioOf(el),
          color: COMMENT_COLOR,
          cText: decodeURIComponent(el.getAttribute("data-comment") || ""),
          cAuthor: el.getAttribute("data-comment-by") || "Comment",
        });
      });
      setTicks(list);
    };
    recompute();
    editor.on("transaction", recompute);
    scroller.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(scroller);
    return () => {
      editor.off("transaction", recompute);
      scroller.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, [editor, scroller]);

  useEffect(() => { bump(); }, [hover]);

  if (!scroller || !rect || ticks.length === 0) return null;

  const jump = (tick: Tick) => {
    const sel = tick.kind === "task" ? `span[data-task="${tick.id}"]` : `span[data-comment-id="${tick.id}"]`;
    const el = scroller.querySelector<HTMLElement>(sel);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("review-spotlight");
    setTimeout(() => el.classList.remove("review-spotlight"), 5000);
  };

  const hoveredTick = hover ? ticks.find((t) => t.id === hover.id) : null;
  const hoveredTask = hoveredTick?.kind === "task" ? editTasks.find((t) => t.id === hover!.id) : null;

  return (
    <>
      {/* Static indicator rail (fixed; re-anchored to the scroll viewport) */}
      <div
        style={{ position: "fixed", top: rect.top, right: rect.right + 2, height: rect.height, width: 14, zIndex: 40, pointerEvents: "none" }}
      >
        <div style={{ position: "absolute", inset: "0 5px", borderRadius: 999, background: "var(--bg-elev-2)", opacity: 0.5 }} />
        {ticks.map((t) => (
          <button
            key={t.kind + t.id}
            onClick={() => jump(t)}
            onMouseEnter={() => showTip(t.id, rect.top + t.ratio * rect.height)}
            onMouseLeave={scheduleHide}
            title={t.kind === "comment" ? "Comment — click to jump" : "Review task — click to jump"}
            style={{
              position: "absolute",
              top: `${t.ratio * 100}%`,
              right: 0,
              width: 14,
              height: 5,
              borderRadius: 3,
              background: t.color,
              border: "none",
              padding: 0,
              cursor: "pointer",
              pointerEvents: "auto",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
              transition: "transform 120ms ease",
            }}
            onMouseDown={(e) => e.preventDefault()}
          />
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && hoveredTick && (
        <div
          style={{
            position: "fixed",
            top: Math.min(hover.y - 10, window.innerHeight - 120),
            right: rect.right + 24,
            zIndex: 41,
            width: 230,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
          onMouseLeave={scheduleHide}
        >
          {hoveredTick.kind === "comment" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <MessageSquare size={13} style={{ color: COMMENT_COLOR }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{hoveredTick.cAuthor}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>comment</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5, maxHeight: 72, overflow: "hidden" }}>{hoveredTick.cText}</div>
              <button onClick={() => jump(hoveredTick)} style={{ marginTop: 9, fontSize: 11.5, color: "var(--accent)", fontWeight: 600 }}>
                Jump to comment →
              </button>
            </>
          ) : hoveredTask ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <UserCheck size={13} style={{ color: hoveredTask.assigneeColor }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)" }}>#{hoveredTask.ref ?? "—"}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{hoveredTask.kind === "review" ? "Review" : "Amend"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>{hoveredTask.requestedByName}</span> → {hoveredTask.assigneeName}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5, maxHeight: 54, overflow: "hidden" }}>{hoveredTask.note}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 9 }}>
                <button onClick={() => jump(hoveredTick)} style={{ fontSize: 11.5, color: "var(--accent)", fontWeight: 600 }}>
                  Jump to change →
                </button>
                <button onClick={() => { setOpenTask(hover.id); setHover(null); }} style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500 }}>
                  Expand details
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
