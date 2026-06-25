import { Extension } from "@tiptap/core";

/** Adds a `pageBreak` attribute to horizontal rules so an inserted page break
 *  survives round-tripping (StarterKit's HorizontalRule would otherwise drop
 *  the data attribute). Styled + printed as a page break via CSS. */
export const PageBreak = Extension.create({
  name: "pageBreak",
  addGlobalAttributes() {
    return [
      {
        types: ["horizontalRule"],
        attributes: {
          pageBreak: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute("data-page-break"),
            renderHTML: (attrs: Record<string, string | null>) =>
              attrs.pageBreak ? { "data-page-break": "true" } : {},
          },
        },
      },
    ];
  },
});
