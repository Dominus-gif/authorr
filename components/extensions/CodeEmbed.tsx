"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Code2, Globe, X, RefreshCw } from "lucide-react";
import { useState } from "react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeEmbed: {
      /** Insert a live embed — a remote URL (chart/data viz) or inline HTML/JS. */
      insertCodeEmbed: (attrs: { mode: "url" | "code"; src?: string; code?: string; height?: number }) => ReturnType;
    };
  }
}

interface EmbedAttrs {
  mode: "url" | "code";
  src: string;
  code: string;
  height: number;
}

function EmbedView({ node, deleteNode, editor }: NodeViewProps) {
  const { mode, src, code, height } = node.attrs as EmbedAttrs;
  const [nonce, setNonce] = useState(0);
  return (
    <NodeViewWrapper as="div" data-code-embed="" contentEditable={false} style={{ margin: "1.2em 0", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: "10px 10px 0 0", background: "var(--bg-elev-2)", border: "1px solid var(--border-strong)", borderBottom: "none" }}>
        {mode === "url" ? <Globe size={13} style={{ color: "var(--accent)" }} /> : <Code2 size={13} style={{ color: "var(--accent)" }} />}
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {mode === "url" ? src : "Live code element"}
        </span>
        <button onClick={() => setNonce((n) => n + 1)} title="Reload" style={{ color: "var(--text-tertiary)", display: "flex" }}><RefreshCw size={13} /></button>
        {editor.isEditable && (
          <button onClick={() => deleteNode()} title="Remove" style={{ color: "var(--text-tertiary)", display: "flex" }}><X size={14} /></button>
        )}
      </div>
      <iframe
        key={nonce}
        {...(mode === "url" ? { src } : { srcDoc: code })}
        title="Live embed"
        sandbox={mode === "url" ? "allow-scripts allow-same-origin allow-popups allow-forms" : "allow-scripts allow-modals"}
        style={{ width: "100%", height, border: "1px solid var(--border-strong)", borderRadius: "0 0 10px 10px", background: "#fff", display: "block" }}
      />
    </NodeViewWrapper>
  );
}

export const CodeEmbed = Node.create({
  name: "codeEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      mode: { default: "url" },
      src: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-src") || "" },
      code: {
        default: "",
        parseHTML: (el: HTMLElement) => decodeURIComponent(el.getAttribute("data-code") || ""),
      },
      height: { default: 320, parseHTML: (el: HTMLElement) => Number(el.getAttribute("data-height")) || 320 },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-code-embed]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { mode, src, code, height } = node.attrs as EmbedAttrs;
    const iframe =
      mode === "url"
        ? ["iframe", { src, sandbox: "allow-scripts allow-same-origin allow-popups allow-forms", style: `width:100%;height:${height}px;border:1px solid #d8d8de;border-radius:10px` }]
        : ["iframe", { srcdoc: code, sandbox: "allow-scripts allow-modals", style: `width:100%;height:${height}px;border:1px solid #d8d8de;border-radius:10px` }];
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-code-embed": "",
        "data-mode": mode,
        "data-src": src,
        "data-code": encodeURIComponent(code),
        "data-height": String(height),
        style: "margin:1.2em 0",
      }),
      iframe,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },

  addCommands() {
    return {
      insertCodeEmbed:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { mode: attrs.mode, src: attrs.src ?? "", code: attrs.code ?? "", height: attrs.height ?? 320 } }).run(),
    };
  },
});
