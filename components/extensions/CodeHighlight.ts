import { Extension, findChildren } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { createLowlight, common } from "lowlight";

/** One shared lowlight instance (common ~37 languages — enough to auto-detect
 *  the usual suspects without shipping all 190). */
const lowlight = createLowlight(common);

export const CODE_LANGUAGES = lowlight.listLanguages().sort();

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
}

/** Flatten a hast (highlight.js) tree into ordered {text, classes} runs. */
function flatten(nodes: HastNode[]): { text: string; classes: string[] }[] {
  const out: { text: string; classes: string[] }[] = [];
  const walk = (node: HastNode, inherited: string[]) => {
    if (node.type === "text") {
      out.push({ text: node.value ?? "", classes: inherited });
      return;
    }
    const cls = [...inherited, ...(node.properties?.className ?? [])];
    (node.children ?? []).forEach((c) => walk(c, cls));
  };
  nodes.forEach((n) => walk(n, []));
  return out;
}

function getDecorations(doc: PMNode): DecorationSet {
  const decos: Decoration[] = [];
  findChildren(doc, (n) => n.type.name === "codeBlock").forEach(({ node, pos }) => {
    const text = node.textContent;
    if (!text) return;
    const lang = node.attrs.language as string | null;
    let tree;
    try {
      tree =
        lang && lang !== "auto" && lowlight.registered(lang)
          ? lowlight.highlight(lang, text)
          : lowlight.highlightAuto(text);
    } catch {
      return;
    }
    let from = pos + 1;
    flatten(tree.children as HastNode[]).forEach(({ text: t, classes }) => {
      const to = from + t.length;
      if (classes.length) decos.push(Decoration.inline(from, to, { class: classes.join(" ") }));
      from = to;
    });
  });
  return DecorationSet.create(doc, decos);
}

/** Augments StarterKit's `codeBlock` with: lowlight syntax highlighting (auto
 *  language detection when `language` is unset), a `language` override, and
 *  custom `fontFamily` / `codeColor` so a block can be restyled. */
export const CodeHighlight = Extension.create({
  name: "codeHighlight",

  addProseMirrorPlugins() {
    const key = new PluginKey("codeHighlight");
    return [
      new Plugin({
        key,
        state: {
          init: (_config, { doc }) => getDecorations(doc),
          apply: (tr, deco) => (tr.docChanged ? getDecorations(tr.doc) : deco.map(tr.mapping, tr.doc)),
        },
        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
      }),
    ];
  },
});
