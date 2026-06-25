"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import katex from "katex";
import { useStore } from "@/lib/store";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      /** Insert a rendered inline math/equation node from a LaTeX string. */
      insertMath: (latex: string) => ReturnType;
    };
  }
}

function render(latex: string): string {
  try {
    return katex.renderToString(latex || "\\,", { throwOnError: false, displayMode: false });
  } catch {
    return latex;
  }
}

function MathView({ node, updateAttributes, editor }: NodeViewProps) {
  const latex = (node.attrs.latex as string) || "";
  const edit = () => {
    if (!editor.isEditable) return;
    useStore.getState().openPrompt({
      title: "Edit equation",
      label: "LaTeX",
      placeholder: "e.g. \\frac{a}{b} = c^2",
      defaultValue: latex,
      confirmLabel: "Update",
      onSubmit: (v) => updateAttributes({ latex: v }),
    });
  };
  return (
    <NodeViewWrapper
      as="span"
      data-math=""
      onClick={edit}
      title={latex}
      style={{ display: "inline-block", cursor: editor.isEditable ? "pointer" : "default", padding: "0 2px", borderRadius: 4 }}
      dangerouslySetInnerHTML={{ __html: render(latex) }}
    />
  );
}

/** Inline math equations rendered with KaTeX. Stored as `data-latex` so the
 *  source survives reload/export; the node view renders the formula. */
export const MathInline = Node.create({
  name: "mathInline",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs: { latex?: string }) => ({ "data-latex": attrs.latex ?? "" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-math]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Plain-text LaTeX fallback for export/serialization (node view renders it).
    return ["span", mergeAttributes(HTMLAttributes, { "data-math": "" }), `\\(${node.attrs.latex}\\)`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView);
  },

  addCommands() {
    return {
      insertMath:
        (latex: string) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { latex } }).run(),
    };
  },
});
