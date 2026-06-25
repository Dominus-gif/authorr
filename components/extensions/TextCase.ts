import { Extension } from "@tiptap/core";
import type { Mark } from "@tiptap/pm/model";

export type CaseMode = "upper" | "lower" | "sentence";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textCase: {
      /** Recase the current selection, preserving all marks/formatting. */
      transformCase: (mode: CaseMode) => ReturnType;
    };
  }
}

function applyCase(text: string, mode: CaseMode): string {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "lower") return text.toLowerCase();
  // Sentence case: lowercase, then capitalise the first letter of each sentence
  // (start of text, after .!? + space, or after a newline). Length-preserving.
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*\p{L})|([.!?]["')\]]?\s+\p{L})|(\n\s*\p{L})/gu, (m) => m.toUpperCase());
}

/** Quick capitalization controls — UPPERCASE, lowercase, Sentence case — that
 *  keep marks intact by re-emitting each text node with its original marks. */
export const TextCase = Extension.create({
  name: "textCase",

  addCommands() {
    return {
      transformCase:
        (mode: CaseMode) =>
        ({ state, dispatch }) => {
          const { from, to, empty } = state.selection;
          if (empty || to <= from) return false;

          const segs: { from: number; to: number; text: string; marks: readonly Mark[] }[] = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText || !node.text) return;
            const start = Math.max(pos, from);
            const end = Math.min(pos + node.nodeSize, to);
            if (end <= start) return;
            segs.push({ from: start, to: end, text: node.text.slice(start - pos, end - pos), marks: node.marks });
          });
          if (!segs.length) return false;

          const transformed = applyCase(segs.map((s) => s.text).join(""), mode);
          if (!dispatch) return true;

          const tr = state.tr;
          let cursor = 0;
          const pieces = segs.map((s) => {
            const newText = transformed.slice(cursor, cursor + s.text.length);
            cursor += s.text.length;
            return { ...s, newText };
          });
          // Apply back-to-front so earlier positions stay valid.
          for (let i = pieces.length - 1; i >= 0; i--) {
            const p = pieces[i];
            if (p.newText.length) tr.replaceWith(p.from, p.to, state.schema.text(p.newText, p.marks));
          }
          dispatch(tr.setSelection(state.selection.map(tr.doc, tr.mapping)));
          return true;
        },
    };
  },
});
