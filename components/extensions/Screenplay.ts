import { Extension } from "@tiptap/core";

export type ScriptElement = "scene" | "action" | "shot" | "character" | "parenthetical" | "dialogue" | "transition";

export const SCENE_ORDER: ScriptElement[] = ["scene", "action", "shot", "character", "parenthetical", "dialogue", "transition"];

// Final Draft-style Enter flow: which element naturally follows the current one.
const NEXT_ON_ENTER: Record<ScriptElement, ScriptElement> = {
  scene: "action",
  action: "action",
  shot: "action",
  character: "dialogue",
  parenthetical: "dialogue",
  dialogue: "action",
  transition: "scene",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    screenplay: {
      setScriptElement: (el: ScriptElement) => ReturnType;
      setDualDialogue: (side: "L" | "R" | null) => ReturnType;
    };
  }
  interface Storage {
    screenplay: { active: boolean };
  }
}

/** Industry-standard screenplay auto-formatter (Final Draft / Fade In style).
 *  Tags each paragraph with a `sceneElement` (rendered + styled via CSS); Tab
 *  cycles the element type, Enter advances to the next logical element. Active
 *  only in Scriptwriting mode (`storage.active`, synced from the store). */
export const Screenplay = Extension.create({
  name: "screenplay",

  addStorage() {
    return { active: false };
  },

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          sceneElement: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute("data-sx"),
            renderHTML: (attrs: Record<string, string | null>) =>
              attrs.sceneElement ? { "data-sx": attrs.sceneElement } : {},
          },
          dual: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute("data-dual"),
            renderHTML: (attrs: Record<string, string | null>) =>
              attrs.dual ? { "data-dual": attrs.dual } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setScriptElement:
        (el) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { sceneElement: el }),
      setDualDialogue:
        (side) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { dual: side }),
    };
  },

  addKeyboardShortcuts() {
    const cur = (): ScriptElement => (this.editor.state.selection.$from.parent.attrs.sceneElement as ScriptElement) || "action";
    return {
      Tab: () => {
        if (!this.storage.active) return false;
        const i = SCENE_ORDER.indexOf(cur());
        return this.editor.chain().focus().setScriptElement(SCENE_ORDER[(i + 1) % SCENE_ORDER.length]).run();
      },
      "Shift-Tab": () => {
        if (!this.storage.active) return false;
        const i = SCENE_ORDER.indexOf(cur());
        return this.editor.chain().focus().setScriptElement(SCENE_ORDER[(i - 1 + SCENE_ORDER.length) % SCENE_ORDER.length]).run();
      },
      Enter: () => {
        if (!this.storage.active) return false;
        const next = NEXT_ON_ENTER[cur()];
        return this.editor.chain().focus().splitBlock().updateAttributes("paragraph", { sceneElement: next }).run();
      },
    };
  },
});
