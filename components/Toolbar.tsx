"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Table as TableIcon,
  Table2,
  Image as ImageIcon,
  PenTool,
  Undo2,
  Redo2,
  Hash,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { Minus, Plus, RemoveFormatting, Eraser, PaintBucket, PaintRoller, Baseline, MousePointerSquareDashed, CaseSensitive, MoveHorizontal, Search, SlidersHorizontal, Pencil, Sigma, Languages, MessageSquarePlus, Timer as TimerIcon } from "lucide-react";
import { NodeSelection } from "@tiptap/pm/state";
import { CODE_LANGUAGES } from "./extensions/CodeHighlight";
import type { CaseMode } from "./extensions/TextCase";
import { useStore, selectActiveDoc } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";
import { fontStack } from "@/lib/fonts";
import { withKey } from "@/lib/editorShortcuts";
import { exportPdf } from "@/lib/export";
import { FontPicker } from "./FontPicker";

const FONT_SIZES = [13, 14, 16, 18, 20, 24, 30, 36, 42, 48, 60, 72, 84, 96];

function Btn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
  ref,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 7,
        flexShrink: 0,
        color: active ? "var(--accent)" : "var(--text-secondary)",
        background: active ? "var(--accent-soft)" : "transparent",
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => !active && !disabled && (e.currentTarget.style.background = "var(--bg-elev-2)")}
      onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={16} />
    </button>
  );
}

const Sep = () => (
  <span style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
);

export function Toolbar() {
  const editor = useEditorInstance();
  const font = useStore((s) => s.font);
  const lineNumbers = useStore((s) => s.lineNumbers);
  const toggleLineNumbers = useStore((s) => s.toggleLineNumbers);
  const moveMode = useStore((s) => s.moveMode);
  const toggleMoveMode = useStore((s) => s.toggleMoveMode);
  const findReplaceOpen = useStore((s) => s.findReplaceOpen);
  const setFindReplaceOpen = useStore((s) => s.setFindReplaceOpen);
  const doodleMode = useStore((s) => s.doodleMode);
  const toggleDoodleMode = useStore((s) => s.toggleDoodleMode);
  const setSymbolPickerOpen = useStore((s) => s.setSymbolPickerOpen);
  const setTranslateOpen = useStore((s) => s.setTranslateOpen);
  const isFree = useStore((s) => s.plan === "free");
  const timerOpen = useStore((s) => s.timerOpen);
  const setTimerOpen = useStore((s) => s.setTimerOpen);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const openPrompt = useStore((s) => s.openPrompt);
  const showToast = useStore((s) => s.showToast);
  const doc = useStore(selectActiveDoc);
  const me = users.find((u) => u.id === currentUserId);
  const [, force] = useReducer((x) => x + 1, 0);

  // Keyboard-shortcut bridge for dialog-driven tools (link/comment). The window
  // listener is registered once here (stable hook order); the actual handlers are
  // assigned to the ref further down once `editor` and the prompt helpers exist.
  const shortcutRef = useRef<(detail: string) => void>(() => {});
  useEffect(() => {
    const onShortcut = (e: Event) => shortcutRef.current((e as CustomEvent).detail);
    window.addEventListener("ef:shortcut", onShortcut);
    return () => window.removeEventListener("ef:shortcut", onShortcut);
  }, []);

  // Coalesce rapid editor events (e.g. dragging the color picker fires a burst
  // of transactions) into a single re-render per animation frame — keeps color
  // picking and typing snappy instead of re-running every can()/isActive check
  // on every transaction.
  useEffect(() => {
    if (!editor) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        force();
      });
    };
    editor.on("transaction", schedule);
    editor.on("selectionUpdate", schedule);
    return () => {
      editor.off("transaction", schedule);
      editor.off("selectionUpdate", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [editor]);

  if (!editor) return null;
  const c = () => editor.chain().focus();

  const setLink = () => useStore.getState().setLinkDialogOpen(true);

  const addComment = () => {
    const sel = editor.state.selection;
    if (sel.empty) {
      showToast("Select the text you want to comment on first.");
      return;
    }
    const range = { from: sel.from, to: sel.to };
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
          .setTextSelection(range)
          .setComment({ id: "c-" + Math.random().toString(36).slice(2, 9), text: textVal.trim(), author: me?.name ?? "You" })
          .run();
      },
    });
  };

  // Dialog-driven tools triggered by keyboard shortcuts dispatch through this ref
  // (assigned below, after the handlers exist) so hook order stays stable.
  shortcutRef.current = (detail) => {
    if (detail === "link") setLink();
    else if (detail === "comment") addComment();
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => c().setImage({ src: reader.result as string, alt: file.name }).run();
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Alignment applies to the selected image/doodle node when one is selected,
  // otherwise to the current text block — so "keep alignment proper" holds for
  // both prose and moved elements.
  const selectedNodeType = (): string | null => {
    const sel = editor.state.selection;
    return sel instanceof NodeSelection ? sel.node.type.name : null;
  };
  const applyAlign = (dir: "left" | "center" | "right") => {
    const type = selectedNodeType();
    if (type === "image" || type === "drawing") {
      editor.chain().focus().updateAttributes(type, { align: dir }).run();
    } else {
      c().setTextAlign(dir).run();
    }
  };
  const alignActive = (dir: "left" | "center" | "right") => {
    const type = selectedNodeType();
    if (type === "image" || type === "drawing") return editor.getAttributes(type).align === dir;
    return editor.isActive({ textAlign: dir });
  };

  const curSize = parseInt(String(editor.getAttributes("textStyle").fontSize ?? "")) || 18;
  const stepSize = (dir: number) => {
    const idx = FONT_SIZES.findIndex((s) => s >= curSize);
    const base = idx < 0 ? FONT_SIZES.length - 1 : idx;
    const ni = Math.min(FONT_SIZES.length - 1, Math.max(0, base + dir));
    editor.chain().focus().setFontSize(`${FONT_SIZES[ni]}px`).run();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "6px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elev)",
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      <Btn icon={Undo2} label="Undo" onClick={() => c().undo().run()} disabled={!editor.can().undo()} />
      <Btn icon={Redo2} label="Redo" onClick={() => c().redo().run()} disabled={!editor.can().redo()} />
      <Sep />
      <FontPicker />
      <span style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Btn icon={Minus} label="Decrease font size" onClick={() => stepSize(-1)} />
        <span style={{ width: 26, textAlign: "center", fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
          {curSize}
        </span>
        <Btn icon={Plus} label="Increase font size" onClick={() => stepSize(1)} />
      </span>
      <Sep />
      <Btn icon={Bold} label={withKey("Bold", "bold")} active={editor.isActive("bold")} onClick={() => c().toggleBold().run()} />
      <Btn icon={Italic} label={withKey("Italic", "italic")} active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()} />
      <Btn icon={UnderlineIcon} label={withKey("Underline", "underline")} active={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()} />
      <Btn icon={Strikethrough} label={withKey("Strikethrough", "strike")} active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()} />
      <TextColorTool editor={editor} />
      <Btn icon={Highlighter} label={withKey("Highlight (pen)", "highlight")} active={editor.isActive("highlight")} onClick={() => c().toggleHighlight({ color: "#ef9f2733" }).run()} />
      <PaintBucketTool editor={editor} />
      <PageFillTool />
      <Btn icon={Eraser} label="Eraser (remove highlight/annotation)" onClick={() => c().unsetHighlight().unsetAnnotation().run()} />
      <Btn icon={RemoveFormatting} label={withKey("Clear formatting", "clear")} onClick={() => c().unsetAllMarks().clearNodes().run()} />
      <TextCaseTool editor={editor} />
      <LetterSpacingTool editor={editor} />
      <Sep />
      <Btn icon={Heading1} label={withKey("Heading 1", "h1")} active={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()} />
      <Btn icon={Heading2} label={withKey("Heading 2", "h2")} active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()} />
      <Btn icon={Heading3} label={withKey("Heading 3", "h3")} active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()} />
      <Sep />
      <Btn icon={AlignLeft} label={withKey("Align left", "alignLeft")} active={alignActive("left")} onClick={() => applyAlign("left")} />
      <Btn icon={AlignCenter} label={withKey("Align center", "alignCenter")} active={alignActive("center")} onClick={() => applyAlign("center")} />
      <Btn icon={AlignRight} label={withKey("Align right", "alignRight")} active={alignActive("right")} onClick={() => applyAlign("right")} />
      <Sep />
      <Btn icon={List} label={withKey("Bullet list", "bullet")} active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()} />
      <Btn icon={ListOrdered} label={withKey("Numbered list", "ordered")} active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()} />
      <Btn icon={ListChecks} label={withKey("Checklist", "task")} active={editor.isActive("taskList")} onClick={() => c().toggleTaskList().run()} />
      <Btn icon={Quote} label={withKey("Quote", "quote")} active={editor.isActive("blockquote")} onClick={() => c().blockquoteSelection().run()} />
      <Btn icon={Code2} label={withKey("Code block", "codeblock")} active={editor.isActive("codeBlock")} onClick={() => c().codeBlockSelection().run()} />
      {editor.isActive("codeBlock") && <CodeStyleTool editor={editor} />}
      <Sep />
      <Btn icon={TableIcon} label="Insert table" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      {editor.isActive("table") && <TablePropsTool editor={editor} />}
      <Btn icon={ImageIcon} label="Insert image" onClick={insertImage} />
      <Btn icon={Pencil} label="Doodle on page (draw on the text)" active={doodleMode} onClick={toggleDoodleMode} />
      <Btn icon={PenTool} label="Signature field" onClick={() => c().setSignature(me?.name ?? "").run()} />
      <Btn icon={Link2} label={withKey("Link", "link")} active={editor.isActive("link")} onClick={setLink} />
      <Btn icon={MessageSquarePlus} label={withKey("Add comment to selection", "comment")} active={editor.isActive("comment")} onClick={addComment} />
      <Btn icon={Sigma} label="Special characters & equations" onClick={() => setSymbolPickerOpen(true)} />
      {!isFree && <Btn icon={Languages} label="Translate" onClick={() => setTranslateOpen(true)} />}
      {!isFree && (
        <button
          onClick={() => setTimerOpen(!timerOpen)}
          title="Focus timer"
          style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", border: "1px solid var(--border)", color: timerOpen ? "var(--accent)" : "var(--text-secondary)", background: timerOpen ? "var(--accent-soft)" : "transparent" }}
        >
          <TimerIcon size={15} /> Focus Timer
        </button>
      )}
      <Sep />
      <Btn icon={MousePointerSquareDashed} label="Move tool — drag any element to reposition it" active={moveMode} onClick={toggleMoveMode} />
      <span style={{ flex: 1, minWidth: 8 }} />
      <Btn icon={Search} label="Find & replace" active={findReplaceOpen} onClick={() => setFindReplaceOpen(!findReplaceOpen)} />
      <Btn icon={Hash} label="Line numbers" active={lineNumbers} onClick={toggleLineNumbers} />
    </div>
  );
}

/** Apply a color at most once per animation frame (the OS color picker fires
 *  `change` continuously while dragging — without this each emits a transaction). */
function useRafColor(apply: (c: string) => void) {
  const raf = useRef(0);
  const latest = useRef("");
  return (c: string) => {
    latest.current = c;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      apply(latest.current);
    });
  };
}

const TEXT_COLORS = [
  { label: "Default", value: null },
  { label: "Amber", value: "#ef9f27" },
  { label: "Red", value: "#e24b4a" },
  { label: "Green", value: "#3fae74" },
  { label: "Blue", value: "#4f8fd6" },
  { label: "Violet", value: "#7f77dd" },
  { label: "Pink", value: "#d4537e" },
  { label: "Teal", value: "#2bb3ac" },
  { label: "Slate", value: "#8a8f99" },
  { label: "Ink", value: "#16161a" },
  { label: "White", value: "#f4f4f5" },
];

function TextColorTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = (editor.getAttributes("textStyle").color as string | undefined) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ left: Math.min(r.left, window.innerWidth - 200), top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  const pick = (color: string | null) => {
    if (color) editor.chain().focus().setFontColor(color).run();
    else editor.chain().focus().unsetFontColor().run();
    setOpen(false);
  };
  const pickThrottled = useRafColor((c) => editor.chain().setFontColor(c).run());

  return (
    <div ref={ref} style={{ display: "flex" }}>
      <Btn ref={btnRef} icon={Baseline} label="Font color" active={open || !!current} onClick={toggle} />
      {open && (
        <div
          style={{
            position: "fixed",
            left: coords.left,
            top: coords.top,
            zIndex: 80,
            width: 188,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: 8,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 7 }}>Text color</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {TEXT_COLORS.map((cl) => {
              const active = current === cl.value || (!current && cl.value === null);
              return (
                <button
                  key={cl.label}
                  title={cl.label}
                  onMouseDown={(e) => { e.preventDefault(); pick(cl.value); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: cl.value ?? "transparent",
                    border: active ? "2px solid var(--accent)" : "1px solid var(--border-strong)",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                  }}
                >
                  {cl.value === null ? "A" : ""}
                </button>
              );
            })}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 9,
              paddingTop: 9,
              borderTop: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: `conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)`,
                flexShrink: 0,
              }}
            />
            Custom color…
            <input
              type="color"
              value={typeof current === "string" && current.startsWith("#") ? current : "#ff6b00"}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => pickThrottled(e.target.value)}
              style={{ marginLeft: "auto", width: 28, height: 24, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/** Shared dropdown popover anchored under a toolbar button. */
function ToolPopover({
  icon,
  label,
  active,
  width = 200,
  children,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  width?: number;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ left: Math.min(r.left, window.innerWidth - width - 12), top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ display: "flex" }}>
      <Btn ref={btnRef} icon={icon} label={label} active={active || open} onClick={toggle} />
      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: coords.left,
            top: coords.top,
            zIndex: 80,
            width,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: 10,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const popLabel: React.CSSProperties = { fontSize: 11, color: "var(--text-tertiary)", marginBottom: 7 };
const popRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "7px 8px",
  borderRadius: 7,
  fontSize: 13,
  textAlign: "left",
  color: "var(--text)",
};
const popSelect: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 7,
  border: "1px solid var(--border-strong)",
  background: "var(--bg-elev)",
  color: "var(--text)",
  fontSize: 12.5,
  marginBottom: 8,
};

function TextCaseTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const modes: [CaseMode, string, string][] = [
    ["upper", "AB", "UPPERCASE"],
    ["lower", "ab", "lowercase"],
    ["sentence", "Ab", "Sentence case"],
  ];
  return (
    <ToolPopover icon={CaseSensitive} label="Change case" width={184}>
      {(close) => (
        <>
          <div style={popLabel}>Change case</div>
          {modes.map(([m, glyph, lbl]) => (
            <button
              key={m}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().transformCase(m).run();
                close();
              }}
              style={popRow}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 22, textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{glyph}</span>
              {lbl}
            </button>
          ))}
        </>
      )}
    </ToolPopover>
  );
}

const SPACINGS: [string, string | null][] = [
  ["Tighter", "-0.06em"],
  ["Tight", "-0.03em"],
  ["Normal", null],
  ["Wide", "0.08em"],
  ["Wider", "0.16em"],
];

function LetterSpacingTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const cur = (editor.getAttributes("textStyle").letterSpacing as string | undefined) ?? null;
  return (
    <ToolPopover icon={MoveHorizontal} label="Letter spacing" active={!!cur} width={184}>
      {(close) => (
        <>
          <div style={popLabel}>Letter spacing</div>
          {SPACINGS.map(([lbl, val]) => {
            const active = cur === val || (!cur && val === null);
            return (
              <button
                key={lbl}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (val) editor.chain().focus().setLetterSpacing(val).run();
                  else editor.chain().focus().unsetLetterSpacing().run();
                  close();
                }}
                style={{ ...popRow, color: active ? "var(--accent)" : "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {lbl}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{val ?? "0"}</span>
              </button>
            );
          })}
        </>
      )}
    </ToolPopover>
  );
}

const CODE_FONTS: [string, string][] = [
  ["Default mono", "var(--font-mono)"],
  ["JetBrains Mono", "'JetBrains Mono', ui-monospace, monospace"],
  ["Courier", "'Courier New', Courier, monospace"],
  ["System mono", "ui-monospace, SFMono-Regular, Menlo, monospace"],
];

function CodeStyleTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const attrs = editor.getAttributes("codeBlock") as { language?: string | null; fontFamily?: string | null; codeColor?: string | null; background?: string | null };
  const upd = (a: Record<string, unknown>) => editor.chain().focus().updateAttributes("codeBlock", a).run();
  const updCodeColor = useRafColor((c) => editor.chain().updateAttributes("codeBlock", { codeColor: c }).run());
  const updCodeBg = useRafColor((c) => editor.chain().updateAttributes("codeBlock", { background: c }).run());
  return (
    <ToolPopover icon={SlidersHorizontal} label="Code block style" width={236}>
      {() => (
        <>
          <div style={popLabel}>Language (auto-detected)</div>
          <select style={popSelect} value={attrs.language ?? "auto"} onChange={(e) => upd({ language: e.target.value === "auto" ? null : e.target.value })}>
            <option value="auto">Auto-detect</option>
            {CODE_LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <div style={popLabel}>Font</div>
          <select style={popSelect} value={attrs.fontFamily ?? "var(--font-mono)"} onChange={(e) => upd({ fontFamily: e.target.value === "var(--font-mono)" ? null : e.target.value })}>
            {CODE_FONTS.map(([lbl, val]) => (
              <option key={lbl} value={val}>{lbl}</option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8 }}>
            Base text color
            <input
              type="color"
              value={typeof attrs.codeColor === "string" && attrs.codeColor.startsWith("#") ? attrs.codeColor : "#e6e6ea"}
              onChange={(e) => updCodeColor(e.target.value)}
              style={{ marginLeft: "auto", width: 30, height: 24, border: "none", background: "transparent", cursor: "pointer" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8 }}>
            Background fill
            <input
              type="color"
              value={typeof attrs.background === "string" && attrs.background.startsWith("#") ? attrs.background : "#1b1b20"}
              onChange={(e) => updCodeBg(e.target.value)}
              style={{ marginLeft: "auto", width: 30, height: 24, border: "none", background: "transparent", cursor: "pointer" }}
            />
          </label>
          <button
            onMouseDown={(e) => { e.preventDefault(); upd({ language: null, fontFamily: null, codeColor: null, background: null }); }}
            style={{ width: "100%", fontSize: 12, padding: "6px 0", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
          >
            Reset code style
          </button>
        </>
      )}
    </ToolPopover>
  );
}

function TablePropsTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const a = editor.getAttributes("table") as { borderWidth?: string; borderColor?: string; borderStyle?: string; headerBg?: string };
  const upd = (x: Record<string, unknown>) => editor.chain().focus().updateAttributes("table", x).run();
  const updBorderColor = useRafColor((c) => editor.chain().updateAttributes("table", { borderColor: c }).run());
  const updHeaderBg = useRafColor((c) => editor.chain().updateAttributes("table", { headerBg: c }).run());
  const hex = (v: string | undefined, fallback: string) => (typeof v === "string" && v.startsWith("#") ? v : fallback);
  const opBtn = (label: string, onClick: () => void) => (
    <button
      key={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{ fontSize: 12, padding: "6px 8px", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {label}
    </button>
  );
  return (
    <ToolPopover icon={Table2} label="Table properties" width={248}>
      {() => (
        <>
          <div style={popLabel}>Border width</div>
          <select style={popSelect} value={a.borderWidth ?? "1px"} onChange={(e) => upd({ borderWidth: e.target.value })}>
            {["0px", "1px", "2px", "3px", "4px", "6px"].map((w) => (
              <option key={w} value={w}>{w === "0px" ? "None" : w}</option>
            ))}
          </select>
          <div style={popLabel}>Border style</div>
          <select style={popSelect} value={a.borderStyle ?? "solid"} onChange={(e) => upd({ borderStyle: e.target.value })}>
            {["solid", "dashed", "dotted", "double"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8 }}>
            Border color
            <input type="color" value={hex(a.borderColor, "#888888")} onChange={(e) => updBorderColor(e.target.value)} style={{ marginLeft: "auto", width: 30, height: 24, border: "none", background: "transparent", cursor: "pointer" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 10 }}>
            Header tint
            <input type="color" value={hex(a.headerBg, "#2a2a2f")} onChange={(e) => updHeaderBg(e.target.value)} style={{ marginLeft: "auto", width: 30, height: 24, border: "none", background: "transparent", cursor: "pointer" }} />
          </label>
          <div style={{ height: 1, background: "var(--border)", margin: "2px 0 9px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {opBtn("+ Row", () => editor.chain().focus().addRowAfter().run())}
            {opBtn("+ Column", () => editor.chain().focus().addColumnAfter().run())}
            {opBtn("− Row", () => editor.chain().focus().deleteRow().run())}
            {opBtn("− Column", () => editor.chain().focus().deleteColumn().run())}
            {opBtn("Toggle header", () => editor.chain().focus().toggleHeaderRow().run())}
            {opBtn("Delete table", () => editor.chain().focus().deleteTable().run())}
          </div>
        </>
      )}
    </ToolPopover>
  );
}

const FILL_COLORS = [
  { label: "Amber", value: "#ef9f2740" },
  { label: "Green", value: "#5dca8f40" },
  { label: "Violet", value: "#7f77dd40" },
  { label: "Blue", value: "#5b9ddd40" },
  { label: "Pink", value: "#d4537e40" },
  { label: "Red", value: "#e24b4a40" },
];

function PaintBucketTool({ editor }: { editor: NonNullable<ReturnType<typeof useEditorInstance>> }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ left: Math.min(r.left, window.innerWidth - 180), top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  const fill = (color: string | null) => {
    if (color) editor.chain().focus().setHighlight({ color }).run();
    else editor.chain().focus().unsetHighlight().run();
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ display: "flex" }}>
      <Btn ref={btnRef} icon={PaintBucket} label="Paint bucket (fill)" active={open} onClick={toggle} />
      {open && (
        <div
          style={{
            position: "fixed",
            left: coords.left,
            top: coords.top,
            zIndex: 80,
            width: 168,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: 8,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 7 }}>Fill selection</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {FILL_COLORS.map((cl) => (
              <button
                key={cl.value}
                title={cl.label}
                onMouseDown={(e) => { e.preventDefault(); fill(cl.value); }}
                style={{ width: 20, height: 20, borderRadius: 5, background: cl.value, border: "1px solid var(--border-strong)" }}
              />
            ))}
          </div>
          <button
            onMouseDown={(e) => { e.preventDefault(); fill(null); }}
            style={{ marginTop: 8, width: "100%", fontSize: 12, padding: "5px 0", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
          >
            Remove fill
          </button>
        </div>
      )}
    </div>
  );
}

// Solid page-fill swatches (opaque) for the whole writing canvas.
const PAGE_FILL_COLORS = [
  "#ffffff", "#f8fafc", "#f3f4f6", "#fff8f1", "#fef9c3", "#ecfdf5",
  "#e0f2fe", "#ede9fe", "#fce7f3", "#1f2937", "#0f172a", "#111111",
];

/** Paint the entire writing page/canvas with a chosen background color. */
function PageFillTool() {
  const pageColor = useStore((s) => (s.activeDocId ? s.pageColors[s.activeDocId] : undefined));
  const setPageColor = useStore((s) => s.setPageColor);
  const requireFeature = useStore((s) => s.requireFeature);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    // Canvas background adjustments are a premium (Pro) feature.
    if (!open && !requireFeature("paperTexture")) return;
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ left: Math.min(r.left, window.innerWidth - 200), top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ display: "flex" }}>
      <Btn ref={btnRef} icon={PaintRoller} label="Fill page color" active={open || !!pageColor} onClick={toggle} />
      {open && (
        <div
          style={{ position: "fixed", left: coords.left, top: coords.top, zIndex: 80, width: 190, background: "var(--bg-elev-2)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: 10, boxShadow: "0 14px 36px rgba(0,0,0,0.34)" }}
        >
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>Fill the whole page</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {PAGE_FILL_COLORS.map((cl) => (
              <button
                key={cl}
                title={cl}
                onMouseDown={(e) => { e.preventDefault(); setPageColor(cl); }}
                style={{ width: 22, height: 22, borderRadius: 5, background: cl, border: pageColor === cl ? "2px solid var(--accent)" : "1px solid var(--border-strong)" }}
              />
            ))}
          </div>
          <label title="Custom page color" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, overflow: "hidden", border: "1px solid var(--border-strong)", background: "conic-gradient(from 0deg,#ef4444,#eab308,#22c55e,#3b82f6,#8b5cf6,#ec4899,#ef4444)", flexShrink: 0 }}>
              <input type="color" value={pageColor ?? "#ffffff"} onChange={(e) => setPageColor(e.target.value)} style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
            </span>
            Custom color…
          </label>
          <button
            onMouseDown={(e) => { e.preventDefault(); setPageColor(null); setOpen(false); }}
            style={{ marginTop: 10, width: "100%", fontSize: 12, padding: "5px 0", borderRadius: 7, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
          >
            Reset to theme
          </button>
        </div>
      )}
    </div>
  );
}
