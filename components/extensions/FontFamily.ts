import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docFontFamily: {
      setFontFamily: (family: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
  }
}

/** Per-selection font family, stored on the textStyle mark. Requires TextStyle. */
export const FontFamily = Extension.create({
  name: "docFontFamily",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontFamily?.replace(/^['"]+|['"]+$/g, "") || null,
            renderHTML: (attributes: { fontFamily?: string }) =>
              attributes.fontFamily ? { style: `font-family: ${attributes.fontFamily}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (family: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontFamily: family }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontFamily: null }).removeEmptyTextStyle().run(),
    };
  },
});
