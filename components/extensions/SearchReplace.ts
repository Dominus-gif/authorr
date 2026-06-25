import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

interface MatchRange {
  from: number;
  to: number;
}

interface SearchStorage {
  term: string;
  caseSensitive: boolean;
  results: MatchRange[];
  index: number;
}

const searchKey = new PluginKey("searchReplace");

function findMatches(doc: PMNode, term: string, caseSensitive: boolean): MatchRange[] {
  if (!term) return [];
  const res: MatchRange[] = [];
  const q = caseSensitive ? term : term.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const hay = caseSensitive ? node.text : node.text.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(q, i)) !== -1) {
      res.push({ from: pos + i, to: pos + i + q.length });
      i += q.length;
    }
  });
  return res;
}

declare module "@tiptap/core" {
  interface Storage {
    searchReplace: SearchStorage;
  }
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string, caseSensitive?: boolean) => ReturnType;
      setSearchIndex: (index: number) => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAllMatches: (replacement: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

/** Find & replace with live, highlighted matches. Results live in extension
 *  storage; a decoration plugin paints every match and emphasises the current
 *  one, and recomputes as the document changes. */
export const SearchReplace = Extension.create<unknown, SearchStorage>({
  name: "searchReplace",

  addStorage() {
    return { term: "", caseSensitive: false, results: [], index: 0 };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term, caseSensitive = false) =>
        ({ editor, tr, dispatch, state }) => {
          const s = editor.storage.searchReplace as SearchStorage;
          s.term = term;
          s.caseSensitive = caseSensitive;
          s.results = findMatches(state.doc, term, caseSensitive);
          s.index = s.results.length ? Math.min(s.index, s.results.length - 1) : 0;
          if (dispatch) dispatch(tr.setMeta(searchKey, true));
          return true;
        },
      setSearchIndex:
        (index) =>
        ({ editor, tr, dispatch }) => {
          const s = editor.storage.searchReplace as SearchStorage;
          s.index = index;
          if (dispatch) dispatch(tr.setMeta(searchKey, true));
          return true;
        },
      replaceCurrent:
        (replacement) =>
        ({ editor, chain }) => {
          const s = editor.storage.searchReplace as SearchStorage;
          const m = s.results[s.index];
          if (!m) return false;
          return chain().insertContentAt({ from: m.from, to: m.to }, replacement).run();
        },
      replaceAllMatches:
        (replacement) =>
        ({ editor, chain }) => {
          const s = editor.storage.searchReplace as SearchStorage;
          if (!s.results.length) return false;
          let ch = chain();
          // Apply back-to-front so earlier positions remain valid.
          [...s.results]
            .sort((a, b) => b.from - a.from)
            .forEach((m) => {
              ch = ch.insertContentAt({ from: m.from, to: m.to }, replacement);
            });
          return ch.run();
        },
      clearSearch:
        () =>
        ({ editor, tr, dispatch }) => {
          const s = editor.storage.searchReplace as SearchStorage;
          s.term = "";
          s.results = [];
          s.index = 0;
          if (dispatch) dispatch(tr.setMeta(searchKey, true));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage as SearchStorage;
    return [
      new Plugin({
        key: searchKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr) => {
            if (tr.docChanged && storage.term) {
              storage.results = findMatches(tr.doc, storage.term, storage.caseSensitive);
              if (storage.index > storage.results.length - 1) storage.index = Math.max(0, storage.results.length - 1);
            }
            const decos = storage.results.map((m, i) =>
              Decoration.inline(m.from, m.to, { class: i === storage.index ? "search-current" : "search-match" }),
            );
            return DecorationSet.create(tr.doc, decos);
          },
        },
        props: {
          decorations(state) {
            return searchKey.getState(state);
          },
        },
      }),
    ];
  },
});
