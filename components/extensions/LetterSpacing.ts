import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (spacing: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
    };
  }
}

/** Per-selection letter spacing (tracking), stored on the textStyle mark.
 *  Values like "-0.04em" (tight) … "0.12em" (wide). Requires TextStyle. */
export const LetterSpacing = Extension.create({
  name: "letterSpacing",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.letterSpacing || null,
            renderHTML: (attributes: { letterSpacing?: string }) =>
              attributes.letterSpacing ? { style: `letter-spacing: ${attributes.letterSpacing}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (spacing: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: spacing }).run(),
      unsetLetterSpacing:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: null }).removeEmptyTextStyle().run(),
    };
  },
});
