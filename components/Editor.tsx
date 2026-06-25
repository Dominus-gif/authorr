"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Plugin as PMPlugin, PluginKey as PMPluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useStore } from "@/lib/store";
import { isTaskOpen } from "@/lib/types";
import { canEdit } from "@/lib/permissions";
import { SlashMenu } from "./SlashMenu";
import { EditorContextMenu } from "./ContextMenu";
import { Embed } from "./extensions/Embed";
import { Annotation } from "./extensions/Annotation";
import { Comment } from "./extensions/Comment";
import { Signature } from "./extensions/Signature";
import { FontSize } from "./extensions/FontSize";
import { FontFamily } from "./extensions/FontFamily";
import { FontColor } from "./extensions/FontColor";
import { LetterSpacing } from "./extensions/LetterSpacing";
import { TextCase } from "./extensions/TextCase";
import { CodeHighlight } from "./extensions/CodeHighlight";
import { CodeBlockStyled } from "./extensions/CodeBlockStyled";
import { SelectionBlocks } from "./extensions/SelectionBlocks";
import { MathInline } from "./extensions/MathInline";
import { SearchReplace } from "./extensions/SearchReplace";
import { Drawing } from "./extensions/Drawing";
import { CodeEmbed } from "./extensions/CodeEmbed";
import { Autocorrect } from "./extensions/Autocorrect";
import { Screenplay } from "./extensions/Screenplay";
import { PageBreak } from "./extensions/PageBreak";
import { BlockMover } from "./extensions/BlockMover";
import { KeyboardShortcuts } from "./extensions/KeyboardShortcuts";

/** Table with stylable border width/color/style + header tint. The `resizable`
 *  TableView node view ignores attribute-rendered styles, so we push the CSS
 *  vars onto the table's DOM via a node DECORATION (custom properties inherit
 *  down to the cells). Driven by the Table properties menu. */
const StyledTable = Table.extend({
  addAttributes() {
    const styleVar = (name: string, key: string) => ({
      default: null as string | null,
      parseHTML: (el: HTMLElement) => el.style.getPropertyValue(name) || null,
      renderHTML: (attrs: Record<string, string | null>) =>
        attrs[key] ? { style: `${name}: ${attrs[key]}` } : {},
    });
    return {
      ...this.parent?.(),
      borderWidth: styleVar("--tbl-bw", "borderWidth"),
      borderColor: styleVar("--tbl-bc", "borderColor"),
      borderStyle: styleVar("--tbl-bs", "borderStyle"),
      headerBg: styleVar("--tbl-header-bg", "headerBg"),
    };
  },

  addProseMirrorPlugins() {
    const parent = this.parent?.() ?? [];
    const styleDeco = new PMPlugin({
      key: new PMPluginKey("tableStyleDeco"),
      props: {
        decorations: (state) => {
          const decos: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "table") return;
            const a = node.attrs as Record<string, string | null>;
            const parts: string[] = [];
            if (a.borderWidth) parts.push(`--tbl-bw:${a.borderWidth}`);
            if (a.borderColor) parts.push(`--tbl-bc:${a.borderColor}`);
            if (a.borderStyle) parts.push(`--tbl-bs:${a.borderStyle}`);
            if (a.headerBg) parts.push(`--tbl-header-bg:${a.headerBg}`);
            if (parts.length) decos.push(Decoration.node(pos, pos + node.nodeSize, { style: parts.join(";") }));
          });
          return DecorationSet.create(state.doc, decos);
        },
      },
    });
    return [...parent, styleDeco];
  },
});

/** Image with a horizontal alignment attribute so the move tool can keep
 *  pictures left/center/right-aligned when they're repositioned. */
const AlignableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null as null | "left" | "center" | "right",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-align"),
        renderHTML: (attrs: { align?: "left" | "center" | "right" | null }) => {
          if (!attrs.align) return {};
          const margin =
            attrs.align === "left" ? "0 auto 0 0" : attrs.align === "right" ? "0 0 0 auto" : "0 auto";
          return { "data-align": attrs.align, style: `display:block;margin:${margin}` };
        },
      },
    };
  },
});

/** Insert image files as responsive base64 blocks (CDN storage lands in the
 *  services phase). Returns true if at least one image was handled. */
function insertImageFiles(
  files: FileList | File[],
  editor: TiptapEditor,
  pos?: number,
): boolean {
  const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) return false;
  images.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const chain = editor.chain().focus();
      if (typeof pos === "number") chain.insertContentAt(pos, { type: "image", attrs: { src, alt: file.name } });
      else chain.setImage({ src, alt: file.name });
      chain.run();
    };
    reader.readAsDataURL(file);
  });
  return true;
}

interface EditorProps {
  docId: string;
  initialContent: string;
  onTextChange: (text: string) => void;
  onEditorReady: (editor: TiptapEditor | null) => void;
  /** Read-only because the Personal-plan daily collaboration limit is hit. */
  collabReadOnly?: boolean;
  /** This is a team-mode doc on the Personal plan — edits count toward the cap. */
  countsAsCollab?: boolean;
}

const SAVE_DELAY = 800;

export default function Editor({
  docId,
  initialContent,
  onTextChange,
  onEditorReady,
  collabReadOnly = false,
  countsAsCollab = false,
}: EditorProps) {
  const updateDocContent = useStore((s) => s.updateDocContent);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const pushVersion = useStore((s) => s.pushVersion);
  const autoTitle = useStore((s) => s.autoTitle);
  const lineNumbers = useStore((s) => s.lineNumbers);
  const autocorrect = useStore((s) => s.autocorrect);
  const workMode = useStore((s) => s.workMode);
  const moveMode = useStore((s) => s.moveMode);
  const setOpenTask = useStore((s) => s.setOpenTask);
  const reloadNonce = useStore((s) => s.reloadNonce);
  const role = useStore((s) => s.users.find((u) => u.id === s.currentUserId)?.role ?? "author");
  const recordCollabEdit = useStore((s) => s.recordCollabEdit);
  const editable = canEdit(role) && !collabReadOnly;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedDocId = useRef<string>(docId);
  const editorRef = useRef<TiptapEditor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        codeBlock: false,
      }),
      CodeBlockStyled,
      KeyboardShortcuts,
      Placeholder.configure({
        placeholder: "Start writing, or press “/” for commands…",
      }),
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      StyledTable.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      AlignableImage.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TextStyle,
      FontSize,
      FontFamily,
      FontColor,
      LetterSpacing,
      TextCase,
      CodeHighlight,
      SelectionBlocks,
      SearchReplace,
      Embed,
      Annotation,
      Comment,
      Signature,
      Drawing,
      MathInline,
      CodeEmbed,
      Autocorrect,
      Screenplay,
      PageBreak,
      BlockMover,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "min-h-[60vh] focus:outline-none",
        spellcheck: "true",
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length && editorRef.current) {
          if (insertImageFiles(files, editorRef.current)) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (files && files.length && editorRef.current) {
          const coords = view.posAtCoords({
            left: (event as DragEvent).clientX,
            top: (event as DragEvent).clientY,
          });
          if (insertImageFiles(files, editorRef.current, coords?.pos)) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onTextChange(text);
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      saveTimer.current = setTimeout(() => {
        const html = editor.getHTML();
        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        updateDocContent(loadedDocId.current, html);
        const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
        if (firstLine) autoTitle(loadedDocId.current, firstLine);
        if (countsAsCollab) recordCollabEdit();
        pushVersion(loadedDocId.current, html, words);
        // Stale-task detection: any open assigned task whose anchor marker is no
        // longer in the doc was invalidated by this edit — mark it unavailable
        // and record who amended the text.
        const st = useStore.getState();
        const open = st.editTasks.filter((t) => t.docId === loadedDocId.current && isTaskOpen(t.status) && !t.stale);
        if (open.length) {
          const present = new Set<string>();
          editor.state.doc.descendants((node) => {
            node.marks.forEach((m) => { if (m.type.name === "annotation" && m.attrs.taskId) present.add(m.attrs.taskId as string); });
          });
          const meName = st.users.find((u) => u.id === st.currentUserId)?.name ?? "Someone";
          open.forEach((t) => { if (!present.has(t.id)) st.markTaskStale(t.id, meName); });
        }
        setSaveStatus("saved");
        // "Synced" — the persisted (localStorage) write has settled.
        syncTimer.current = setTimeout(() => setSaveStatus("synced"), 500);
      }, SAVE_DELAY);
    },
  });

  // Reflect role-based edit rights (read-only for viewers/users).
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Sync the autocorrect toggle into the extension's storage.
  useEffect(() => {
    if (editor) editor.storage.autocorrect.enabled = autocorrect;
  }, [editor, autocorrect]);

  // Screenplay auto-formatting is active only in Scriptwriting mode.
  useEffect(() => {
    if (editor) editor.storage.screenplay.active = workMode === "scriptwriting";
  }, [editor, workMode]);

  // Keep a ref for editorProps handlers (paste/drop) and expose to parent.
  editorRef.current = editor ?? null;
  useEffect(() => {
    onEditorReady(editor ?? null);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  // Clicking the avatar dot on a request marker opens its detail — but
  // clicking the highlighted TEXT must still place the caret (stay editable).
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-assigned]") as HTMLElement | null;
      const taskId = el?.getAttribute("data-task");
      if (!el || !taskId) return;
      // The dot is the ::after badge at the right edge (~18px). Only open the
      // task panel when the click lands there; otherwise allow normal editing.
      const rect = el.getBoundingClientRect();
      if (e.clientX >= rect.right - 18) {
        e.preventDefault();
        setOpenTask(taskId);
      }
    };
    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor, setOpenTask]);

  // Swap content when the active document changes.
  useEffect(() => {
    if (!editor) return;
    if (docId !== loadedDocId.current) {
      loadedDocId.current = docId;
      editor.commands.setContent(initialContent, { emitUpdate: false });
      onTextChange(editor.getText());
      setSaveStatus("saved");
    }
  }, [docId, initialContent, editor, onTextChange, setSaveStatus]);

  // Initial text report once the editor mounts.
  useEffect(() => {
    if (editor) onTextChange(editor.getText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Force a content reload (e.g. after an approved version restore).
  useEffect(() => {
    if (!editor || reloadNonce === 0) return;
    const latest = useStore.getState().tree;
    const find = (nodes: typeof latest): string | undefined => {
      for (const n of nodes) {
        if (n.id === loadedDocId.current) return n.content;
        if (n.children) {
          const f = find(n.children);
          if (f !== undefined) return f;
        }
      }
    };
    const html = find(latest);
    if (html) {
      editor.commands.setContent(html, { emitUpdate: false });
      onTextChange(editor.getText());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  return (
    <div className={`relative${lineNumbers ? " line-numbers" : ""}${moveMode ? " move-mode" : ""}`}>
      <EditorContent editor={editor} />
      {editor && <SlashMenu editor={editor} />}
      {editor && <EditorContextMenu editor={editor} />}
    </div>
  );
}
