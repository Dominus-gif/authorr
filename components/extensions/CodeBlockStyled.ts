import { CodeBlock } from "@tiptap/extension-code-block";

/** StarterKit's code block, but:
 *  - allows ALL marks inside (bold/italic/underline/strike/textStyle/highlight),
 *    so any text property + background fill works on code — base CodeBlock sets
 *    marks: "" which blocks every mark;
 *  - adds `fontFamily` / `codeColor` / `background` attrs rendered on the <pre>.
 *  Language highlighting is handled by the separate CodeHighlight plugin. */
export const CodeBlockStyled = CodeBlock.extend({
  // "_" = allow every mark in the schema inside the code block.
  marks: "_",

  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontFamily || null,
        renderHTML: (attrs: { fontFamily?: string }) =>
          attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
      },
      codeColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.color || null,
        renderHTML: (attrs: { codeColor?: string }) =>
          attrs.codeColor ? { style: `color: ${attrs.codeColor}` } : {},
      },
      background: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.background || null,
        renderHTML: (attrs: { background?: string }) =>
          attrs.background ? { style: `background: ${attrs.background}` } : {},
      },
    };
  },
});
