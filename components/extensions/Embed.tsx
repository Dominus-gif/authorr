"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { ExternalLink, X, PlayCircle, Globe } from "lucide-react";
import { resolveEmbed } from "@/lib/embeds";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (url: string) => ReturnType;
    };
  }
}

function EmbedView({ node, deleteNode, editor }: NodeViewProps) {
  const { href, provider, label, iframeSrc, domain } = node.attrs as Record<string, string>;
  const Icon = provider === "youtube" || provider === "vimeo" ? PlayCircle : Globe;

  return (
    <NodeViewWrapper
      as="div"
      data-embed=""
      style={{ margin: "1.1em 0", position: "relative" }}
      contentEditable={false}
    >
      {editor.isEditable && (
        <button
          onClick={() => deleteNode()}
          title="Remove embed"
          contentEditable={false}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            width: 26,
            height: 26,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          <X size={14} />
        </button>
      )}

      {iframeSrc ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "#000",
          }}
        >
          <iframe
            src={iframeSrc}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--bg-elev-2)",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 9,
              background: "var(--bg-elev-3)",
              color: "var(--accent)",
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {href}
            </span>
          </span>
          <ExternalLink size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <span style={{ display: "none" }}>{domain}</span>
        </a>
      )}
    </NodeViewWrapper>
  );
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: null },
      provider: { default: null },
      label: { default: null },
      iframeSrc: { default: null },
      domain: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { href, label, iframeSrc } = HTMLAttributes as Record<string, string>;
    if (iframeSrc) {
      return [
        "div",
        mergeAttributes({ "data-embed": "" }),
        ["iframe", { src: iframeSrc, allowfullscreen: "true", title: label ?? "embed" }],
      ];
    }
    return [
      "div",
      mergeAttributes({ "data-embed": "" }),
      ["a", { href, target: "_blank", rel: "noopener noreferrer" }, label ?? href ?? "link"],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },

  addCommands() {
    return {
      setEmbed:
        (url: string) =>
        ({ chain }) => {
          const info = resolveEmbed(url);
          if (!info) return false;
          return chain()
            .insertContent({ type: this.name, attrs: { ...info } })
            .run();
        },
    };
  },
});
