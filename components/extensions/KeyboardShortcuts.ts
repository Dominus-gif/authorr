import { Extension } from "@tiptap/core";

/**
 * Workspace editing shortcuts. Restates TipTap defaults for discoverability and
 * adds bindings for the custom tools (highlight, checklist, clear formatting).
 * Dialog-driven tools (link, comment) dispatch a window event picked up by the
 * Toolbar so they can open their in-app prompt.
 */
export const KeyboardShortcuts = Extension.create({
  name: "workspaceShortcuts",
  addKeyboardShortcuts() {
    const e = this.editor;
    const fire = (detail: string) => () => {
      window.dispatchEvent(new CustomEvent("ef:shortcut", { detail }));
      return true;
    };
    return {
      "Mod-Shift-h": () => e.chain().focus().toggleHighlight({ color: "#ef9f2733" }).run(),
      "Mod-Shift-9": () => e.chain().focus().toggleTaskList().run(),
      "Mod-\\": () => e.chain().focus().unsetAllMarks().run(),
      "Mod-Alt-1": () => e.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Alt-2": () => e.chain().focus().toggleHeading({ level: 2 }).run(),
      "Mod-Alt-3": () => e.chain().focus().toggleHeading({ level: 3 }).run(),
      "Mod-Alt-0": () => e.chain().focus().setParagraph().run(),
      // Dialog-driven tools — handed off to the Toolbar's in-app prompt.
      "Mod-k": fire("link"),
      "Mod-Alt-m": fire("comment"),
    };
  },
});
