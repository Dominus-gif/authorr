import { Extension } from "@tiptap/core";
import { TextSelection, type Transaction } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    selectionBlocks: {
      /** Code-block the selection only — splits the paragraph at the selection
       *  boundaries first so a partial selection doesn't swallow the whole block. */
      codeBlockSelection: () => ReturnType;
      /** Same, for blockquote. */
      blockquoteSelection: () => ReturnType;
    };
  }
}

/** Split the current block at the selection boundaries and return a position
 *  that lands inside the now-isolated middle block. */
function isolate(tr: Transaction, from: number, to: number, blockStart: number, blockEnd: number): number {
  if (to < blockEnd) tr.split(to);
  if (from > blockStart) tr.split(from);
  // Bias right so the position lands inside the isolated middle block.
  return tr.mapping.map(from, 1);
}

export const SelectionBlocks = Extension.create({
  name: "selectionBlocks",

  addCommands() {
    return {
      codeBlockSelection:
        () =>
        ({ state, dispatch, editor, commands }) => {
          if (editor.isActive("codeBlock")) return commands.toggleCodeBlock();
          const { from, to, empty } = state.selection;
          if (empty) return commands.setCodeBlock();
          const $from = state.doc.resolve(from);
          const $to = state.doc.resolve(to);
          const codeType = state.schema.nodes.codeBlock;
          const partial = $from.sameParent($to) && $from.parent.isTextblock && (from > $from.start() || to < $from.end());
          if (!partial) return commands.setCodeBlock();

          const tr = state.tr;
          const mid = isolate(tr, from, to, $from.start(), $from.end());
          // Convert ONLY the isolated middle block (zero-width range = one block).
          tr.setBlockType(mid, mid, codeType);
          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },

      blockquoteSelection:
        () =>
        ({ state, chain, commands, editor }) => {
          if (editor.isActive("blockquote")) return commands.toggleBlockquote();
          const { from, to, empty } = state.selection;
          if (empty) return commands.toggleBlockquote();
          const $from = state.doc.resolve(from);
          const $to = state.doc.resolve(to);
          const partial = $from.sameParent($to) && $from.parent.isTextblock && (from > $from.start() || to < $from.end());
          if (!partial) return commands.wrapIn("blockquote");

          const blockStart = $from.start();
          const blockEnd = $from.end();
          return chain()
            .command(({ tr }) => {
              const mid = isolate(tr, from, to, blockStart, blockEnd);
              // Collapse the selection inside the isolated block so wrapIn only
              // wraps that one block.
              tr.setSelection(TextSelection.create(tr.doc, mid));
              return true;
            })
            .wrapIn("blockquote")
            .run();
        },
    };
  },
});
