/** Single source of truth for workspace editing shortcuts.
 *  `tiptap` = TipTap key syntax for the KeyboardShortcuts extension;
 *  `label`  = human display (auto-localized to ⌘ on macOS) for tooltips/help. */
export interface ShortcutDef { id: string; name: string; tiptap?: string; label: string }

const isMac = typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";
const alt = isMac ? "⌥" : "Alt";
const shift = isMac ? "⇧" : "Shift";

export const SHORTCUTS: Record<string, ShortcutDef> = {
  bold:        { id: "bold", name: "Bold", tiptap: "Mod-b", label: `${mod}+B` },
  italic:      { id: "italic", name: "Italic", tiptap: "Mod-i", label: `${mod}+I` },
  underline:   { id: "underline", name: "Underline", tiptap: "Mod-u", label: `${mod}+U` },
  strike:      { id: "strike", name: "Strikethrough", tiptap: "Mod-Shift-s", label: `${mod}+${shift}+S` },
  highlight:   { id: "highlight", name: "Highlight", tiptap: "Mod-Shift-h", label: `${mod}+${shift}+H` },
  code:        { id: "code", name: "Inline code", tiptap: "Mod-e", label: `${mod}+E` },
  clear:       { id: "clear", name: "Clear formatting", tiptap: "Mod-\\", label: `${mod}+\\` },
  h1:          { id: "h1", name: "Heading 1", tiptap: "Mod-Alt-1", label: `${mod}+${alt}+1` },
  h2:          { id: "h2", name: "Heading 2", tiptap: "Mod-Alt-2", label: `${mod}+${alt}+2` },
  h3:          { id: "h3", name: "Heading 3", tiptap: "Mod-Alt-3", label: `${mod}+${alt}+3` },
  paragraph:   { id: "paragraph", name: "Paragraph", tiptap: "Mod-Alt-0", label: `${mod}+${alt}+0` },
  bullet:      { id: "bullet", name: "Bullet list", tiptap: "Mod-Shift-8", label: `${mod}+${shift}+8` },
  ordered:     { id: "ordered", name: "Numbered list", tiptap: "Mod-Shift-7", label: `${mod}+${shift}+7` },
  task:        { id: "task", name: "Checklist", tiptap: "Mod-Shift-9", label: `${mod}+${shift}+9` },
  quote:       { id: "quote", name: "Quote", tiptap: "Mod-Shift-b", label: `${mod}+${shift}+B` },
  codeblock:   { id: "codeblock", name: "Code block", tiptap: "Mod-Alt-c", label: `${mod}+${alt}+C` },
  alignLeft:   { id: "alignLeft", name: "Align left", tiptap: "Mod-Shift-l", label: `${mod}+${shift}+L` },
  alignCenter: { id: "alignCenter", name: "Align center", tiptap: "Mod-Shift-e", label: `${mod}+${shift}+E` },
  alignRight:  { id: "alignRight", name: "Align right", tiptap: "Mod-Shift-r", label: `${mod}+${shift}+R` },
  link:        { id: "link", name: "Insert link", tiptap: "Mod-k", label: `${mod}+K` },
  comment:     { id: "comment", name: "Add comment", tiptap: "Mod-Alt-m", label: `${mod}+${alt}+M` },
  find:        { id: "find", name: "Find & replace", label: `${mod}+F` },
  // Workspace (non-editor) toggles handled in Workspace keydown
  doodle:      { id: "doodle", name: "Doodle mode", label: `${alt}+D` },
  zoomIn:      { id: "zoomIn", name: "Zoom in", label: `${mod}+=` },
  zoomOut:     { id: "zoomOut", name: "Zoom out", label: `${mod}+-` },
  zoomReset:   { id: "zoomReset", name: "Reset zoom", label: `${mod}+0` },
};

/** Append a shortcut hint to a tooltip label, e.g. "Bold (Ctrl+B)". */
export const withKey = (label: string, id: keyof typeof SHORTCUTS): string => {
  const s = SHORTCUTS[id];
  return s ? `${label} (${s.label})` : label;
};
