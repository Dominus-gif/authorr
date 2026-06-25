import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontColor: {
      setFontColor: (color: string) => ReturnType;
      unsetFontColor: () => ReturnType;
    };
  }
}

/** Per-selection text color, stored on the textStyle mark. Requires TextStyle.
 *  Mirrors FontSize/FontFamily so color persists through HTML/.ef round-trips. */
export const FontColor = Extension.create({
  name: "fontColor",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.color || null,
            renderHTML: (attributes: { color?: string }) =>
              attributes.color ? { style: `color: ${attributes.color}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { color }).run(),
      unsetFontColor:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { color: null }).removeEmptyTextStyle().run(),
    };
  },
});
