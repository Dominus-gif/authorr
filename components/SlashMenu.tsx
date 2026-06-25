"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useStore } from "@/lib/store";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Pilcrow,
  Image as ImageIcon,
  Link2,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface Command {
  title: string;
  hint: string;
  icon: LucideIcon;
  keywords: string;
  run: (editor: Editor) => void;
}

const COMMANDS: Command[] = [
  { title: "Heading 1", hint: "Large section title", icon: Heading1, keywords: "h1 title big", run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", hint: "Medium heading", icon: Heading2, keywords: "h2 subtitle", run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", hint: "Small heading", icon: Heading3, keywords: "h3", run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet list", hint: "Unordered list", icon: List, keywords: "ul bullet unordered", run: (e) => e.chain().focus().toggleBulletList().run() },
  { title: "Numbered list", hint: "Ordered list", icon: ListOrdered, keywords: "ol ordered number", run: (e) => e.chain().focus().toggleOrderedList().run() },
  { title: "Quote", hint: "Block quote", icon: Quote, keywords: "blockquote cite", run: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: "Code block", hint: "Monospaced code", icon: Code2, keywords: "code pre snippet", run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { title: "Divider", hint: "Horizontal rule", icon: Minus, keywords: "hr line separator", run: (e) => e.chain().focus().setHorizontalRule().run() },
  { title: "Paragraph", hint: "Plain text", icon: Pilcrow, keywords: "text body p", run: (e) => e.chain().focus().setParagraph().run() },
  {
    title: "Image",
    hint: "Upload or paste an image",
    icon: ImageIcon,
    keywords: "image photo picture media upload",
    run: (e) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () =>
          e.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run();
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },
  {
    title: "Live data / code",
    hint: "Embed a chart, viz, or interactive code",
    icon: BarChart3,
    keywords: "embed chart graph table data visualization code interactive iframe live observable codepen",
    run: () => useStore.getState().setEmbedDialogOpen(true),
  },
  {
    title: "Embed link",
    hint: "YouTube, Vimeo, GitHub…",
    icon: Link2,
    keywords: "embed link youtube vimeo wikipedia github medium twitter video",
    run: (e) => {
      const store = useStore.getState();
      store.openPrompt({
        title: "Embed a link",
        label: "Paste a link from an approved platform",
        message: "Allowed: YouTube, Vimeo, Wikipedia, GitHub, Medium, Twitter/X.",
        placeholder: "https://youtube.com/watch?v=…",
        confirmLabel: "Embed",
        onSubmit: (url) => {
          if (!url.trim()) return;
          const ok = e.chain().focus().setEmbed(url.trim()).run();
          if (!ok) store.showToast("That link isn’t from an approved platform.");
        },
      });
    },
  },
];

export function SlashMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(0);
  const rangeRef = useRef<{ from: number; to: number } | null>(null);

  const items = COMMANDS.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) || c.keywords.includes(q)
    );
  });

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    rangeRef.current = null;
  }, []);

  const select = useCallback(
    (cmd: Command) => {
      const range = rangeRef.current;
      if (range) {
        editor.chain().focus().deleteRange(range).run();
      }
      cmd.run(editor);
      close();
    },
    [editor, close],
  );

  useEffect(() => {
    const update = () => {
      const { state } = editor;
      const { selection } = state;
      if (!selection.empty) return close();
      const $from = selection.$from;
      const textBefore = $from.parent.textBetween(
        0,
        $from.parentOffset,
        "\n",
        "￼",
      );
      const m = /(^|\s)\/(\w*)$/.exec(textBefore);
      if (!m) return close();
      const matchLen = m[2].length + 1; // slash + query
      const from = selection.from - matchLen;
      rangeRef.current = { from, to: selection.from };
      const c = editor.view.coordsAtPos(selection.from);
      setCoords({ x: c.left, y: c.bottom });
      setQuery(m[2]);
      setActive(0);
      setOpen(true);
    };

    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor, close]);

  // Keyboard navigation (capture so it beats ProseMirror).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % Math.max(items.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + items.length) % Math.max(items.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[active]) select(items[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, items, active, select, close]);

  if (!open || items.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Slash commands"
      style={{
        position: "fixed",
        left: coords.x,
        top: coords.y + 6,
        zIndex: 50,
        width: 248,
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        padding: 6,
        boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
      }}
    >
      {items.map((cmd, i) => {
        const Icon = cmd.icon;
        const isActive = i === active;
        return (
          <button
            key={cmd.title}
            role="option"
            aria-selected={isActive}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              select(cmd);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "7px 9px",
              borderRadius: 8,
              textAlign: "left",
              background: isActive ? "var(--accent-soft)" : "transparent",
              color: "var(--text)",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 28,
                height: 28,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-elev-3)",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <Icon size={15} />
            </span>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cmd.title}</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {cmd.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
