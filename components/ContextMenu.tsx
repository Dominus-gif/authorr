"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  History,
  SpellCheck2,
  Gauge,
  Wand2,
  Highlighter,
  PenLine,
  AtSign,
  UserCheck,
  ClipboardCheck,
  Scissors,
  Copy,
  ClipboardPaste,
  MessageSquarePlus,
  Eraser,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { canMention, canEdit } from "@/lib/permissions";

interface MenuState {
  x: number;
  y: number;
  from: number;
  to: number;
  excerpt: string;
  clickPos: number;
  inTable: boolean;
}

export function EditorContextMenu({ editor }: { editor: Editor }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const {
    users,
    currentUserId,
    aiPanelOpen,
    toggleAIPanel,
    showToast,
    setVersionHistoryOpen,
    setAssignRequest,
    edition,
    collabUnlocked,
    setUpgradePrompt,
    setCollabDialogOpen,
    addEditTask,
    activeDocId,
    setOpenTask,
    openPrompt,
  } = useStore();

  const me = users.find((u) => u.id === currentUserId);
  const ctx = { role: me?.role ?? "author", edition, collabUnlocked };
  const mentionAllowed = canMention(ctx);

  useEffect(() => {
    const dom = editor.view.dom as HTMLElement;
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      const { from, to, empty } = editor.state.selection;
      const excerpt = empty ? "" : editor.state.doc.textBetween(from, to, " ");
      const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      const clickPos = coords?.pos ?? from;
      const inTable = !!(e.target as HTMLElement).closest?.("td, th");
      setMenu({ x: e.clientX, y: e.clientY, from, to, excerpt, clickPos, inTable });
    };
    dom.addEventListener("contextmenu", onCtx);
    return () => dom.removeEventListener("contextmenu", onCtx);
  }, [editor]);

  const close = useCallback(() => setMenu(null), []);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = () => close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onDown, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onDown, true);
    };
  }, [menu, close]);

  // Measure the menu and clamp it into the viewport; re-clamp on resize so it
  // never clips or goes off-screen when the page is resized.
  useLayoutEffect(() => {
    if (!menu) { setPos(null); return; }
    const clamp = () => {
      const w = menuRef.current?.offsetWidth ?? 234;
      const h = menuRef.current?.offsetHeight ?? 360;
      setPos({
        left: Math.max(8, Math.min(menu.x, window.innerWidth - w - 8)),
        top: Math.max(8, Math.min(menu.y, window.innerHeight - h - 8)),
      });
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [menu]);

  if (!menu) return null;

  const hasSel = menu.from !== menu.to;
  const editable = editor.isEditable;

  const aiStub = (label: string) => {
    if (!aiPanelOpen) toggleAIPanel();
    showToast(`${label} runs through the Claude API — wired in the services phase.`);
    close();
  };

  const restoreSel = () => editor.commands.setTextSelection({ from: menu.from, to: menu.to });

  const doCopy = () => {
    restoreSel();
    (editor.view.dom as HTMLElement).focus();
    document.execCommand("copy");
    close();
  };
  const doCut = () => {
    restoreSel();
    (editor.view.dom as HTMLElement).focus();
    document.execCommand("cut");
    close();
  };
  const doPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().setTextSelection({ from: menu.from, to: menu.to }).insertContent(text).run();
    } catch {
      showToast("Clipboard access was blocked — use Ctrl/Cmd+V instead.");
    }
    close();
  };

  const highlight = () => {
    editor.chain().focus().setTextSelection({ from: menu.from, to: menu.to }).toggleHighlight({ color: "#ef9f2733" }).run();
    close();
  };

  const eraseFormatting = () => {
    editor.chain().focus().setTextSelection({ from: menu.from, to: menu.to }).unsetHighlight().unsetAnnotation().unsetMark("textStyle").run();
    close();
  };

  const addComment = () => {
    openPrompt({
      title: "Add comment",
      label: "Comment on the selected text",
      placeholder: "Type your comment…",
      confirmLabel: "Comment",
      onSubmit: (textVal) => {
        if (!textVal.trim()) return;
        editor
          .chain()
          .focus()
          .setTextSelection({ from: menu.from, to: menu.to })
          .setComment({ id: "c-" + Math.random().toString(36).slice(2, 9), text: textVal.trim(), author: me?.name ?? "You" })
          .run();
      },
    });
    close();
  };

  const annotate = () => {
    editor
      .chain()
      .focus()
      .setTextSelection({ from: menu.from, to: menu.to })
      .toggleAnnotation({ color: me?.color ?? "#7f77dd", by: me?.name })
      .run();
    close();
  };

  // Mark the selection for my own review — creates a self-assigned review task
  // and anchors a marker, no dialog needed.
  const markForReview = () => {
    if (!me || !activeDocId) return;
    const taskId = addEditTask({
      docId: activeDocId,
      kind: "review",
      assigneeId: me.id,
      assigneeName: me.name,
      assigneeColor: me.color,
      requestedById: me.id,
      requestedByName: me.name,
      note: "Marked for my review.",
      excerpt: menu.excerpt.slice(0, 140),
    });
    editor
      .chain()
      .focus()
      .setTextSelection({ from: menu.from, to: menu.to })
      .setAnnotation({ color: me.color, by: me.name, assigned: true, taskId, initial: me.name.charAt(0).toUpperCase() })
      .run();
    showToast("Marked for your review — find it in the requests inbox.");
    setOpenTask(taskId);
    close();
  };

  const request = (kind: "amend" | "review") => {
    if (!mentionAllowed) {
      if (edition === "personal" && !collabUnlocked) {
        setCollabDialogOpen(true);
      } else if (!canEdit(ctx.role)) {
        showToast("Your role can’t assign requests — viewers can comment only.");
      } else {
        setUpgradePrompt(kind === "review" ? "review requests" : "@mentions and edit requests");
      }
      close();
      return;
    }
    editor.commands.setTextSelection({ from: menu.from, to: menu.to });
    setAssignRequest({ from: menu.from, to: menu.to, excerpt: menu.excerpt, kind });
    close();
  };

  const tableOp = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => () => {
    fn(editor.chain().focus().setTextSelection(menu.clickPos)).run();
    close();
  };

  const Item = ({ icon: Icon, label, onClick, disabled, accent }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "7px 10px",
        borderRadius: 7,
        fontSize: 13,
        textAlign: "left",
        color: disabled ? "var(--text-tertiary)" : accent ? "var(--accent)" : "var(--text)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = "var(--bg-elev-3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={15} style={{ flexShrink: 0, color: disabled ? "var(--text-tertiary)" : "var(--text-secondary)" }} />
      {label}
    </button>
  );

  const divider = <div style={{ height: 1, background: "var(--border)", margin: "5px 6px" }} />;

  return (
    <div
      ref={menuRef}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos ? pos.left : Math.min(menu.x, window.innerWidth - 244),
        top: pos ? pos.top : Math.min(menu.y, window.innerHeight - (menu.inTable ? 470 : 360)),
        zIndex: 80,
        width: 234,
        maxHeight: "82vh",
        overflowY: "auto",
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        padding: 6,
        boxShadow: "0 14px 38px rgba(0,0,0,0.4)",
      }}
    >
      <Item icon={Copy} label="Copy" onClick={doCopy} disabled={!hasSel} />
      <Item icon={Scissors} label="Cut" onClick={doCut} disabled={!hasSel || !editable} />
      <Item icon={ClipboardPaste} label="Paste" onClick={doPaste} disabled={!editable} />
      {divider}
      <Item icon={Wand2} label="Improve writing" onClick={() => aiStub("Improve writing")} disabled={!hasSel} accent />
      <Item icon={SpellCheck2} label="Grammar check" onClick={() => aiStub("Grammar check")} disabled={!hasSel} />
      <Item icon={Gauge} label="Tone adjustment" onClick={() => aiStub("Tone adjustment")} disabled={!hasSel} />
      {divider}
      <Item icon={Highlighter} label="Highlight (pen)" onClick={highlight} disabled={!hasSel || !editable} />
      <Item icon={MessageSquarePlus} label="Add comment" onClick={addComment} disabled={!hasSel || !editable} />
      <Item icon={PenLine} label="Annotate" onClick={annotate} disabled={!hasSel || !editable} />
      <Item icon={Eraser} label="Erase formatting" onClick={eraseFormatting} disabled={!hasSel || !editable} />
      {divider}
      <Item icon={ClipboardCheck} label="Mark for my review" onClick={markForReview} disabled={!hasSel || !editable} />
      <Item icon={AtSign} label="Ask to amend…" onClick={() => request("amend")} disabled={!hasSel} />
      <Item icon={UserCheck} label="Request review…" onClick={() => request("review")} disabled={!hasSel} />

      {menu.inTable && editable && (
        <>
          {divider}
          <Item icon={Plus} label="Add row below" onClick={tableOp((c) => c.addRowAfter())} />
          <Item icon={Plus} label="Add column right" onClick={tableOp((c) => c.addColumnAfter())} />
          <Item icon={Minus} label="Delete row" onClick={tableOp((c) => c.deleteRow())} />
          <Item icon={Minus} label="Delete column" onClick={tableOp((c) => c.deleteColumn())} />
          <Item icon={TableIcon} label="Delete table" onClick={tableOp((c) => c.deleteTable())} />
        </>
      )}

      {divider}
      <Item icon={History} label="Version history" onClick={() => { setVersionHistoryOpen(true); close(); }} />
    </div>
  );
}
