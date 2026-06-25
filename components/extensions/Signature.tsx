"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { PenTool, X, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    signature: {
      setSignature: (signer?: string) => ReturnType;
    };
  }
}

/** Deterministic 16-char hex "key" binding signer + name + time. Prototype
 *  integrity token, not a real cryptographic signature (services phase). */
function makeHexKey(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    h1 = (h1 ^ input.charCodeAt(i)) >>> 0;
    h1 = (h1 * 0x01000193) >>> 0;
    h2 = (h2 + input.charCodeAt(i) * 31) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).toUpperCase();
}

interface SigAttrs {
  signer: string;
  signed: string | null;
  signedAt: number | null;
  keyHex: string | null;
}

function SignatureView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const { signer, signed, signedAt, keyHex } = node.attrs as SigAttrs;

  const sign = () => {
    useStore.getState().openPrompt({
      title: "Sign document",
      label: "Type a name to sign",
      placeholder: "Full name",
      defaultValue: signer || "",
      confirmLabel: "Sign",
      onSubmit: (name) => {
        if (!name.trim()) return;
        const ts = Date.now();
        const key = makeHexKey(`${name}|${signer}|${ts}`);
        updateAttributes({ signed: name.trim(), signedAt: ts, keyHex: key });
      },
    });
  };

  return (
    <NodeViewWrapper
      as="div"
      data-signature=""
      contentEditable={false}
      style={{ margin: "1.2em 0", position: "relative" }}
    >
      {editor.isEditable && (
        <button
          onClick={() => deleteNode()}
          title="Remove signature field"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
          }}
        >
          <X size={13} />
        </button>
      )}
      <div
        style={{
          border: "1.5px dashed var(--border-strong)",
          borderRadius: 12,
          padding: "18px 20px",
          background: "var(--bg-elev)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 10 }}>
          <PenTool size={16} />
          <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase" }}>
            Signature
          </span>
        </div>
        {signed ? (
          <>
            <div style={{ fontFamily: "var(--font-signature), cursive", fontSize: 36, lineHeight: 1.05, color: "var(--text)", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              {signed}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
                fontSize: 11,
                color: "var(--text-tertiary)",
                flexWrap: "wrap",
              }}
            >
              <ShieldCheck size={14} style={{ color: "var(--success)" }} />
              <span style={{ color: "var(--success)", fontWeight: 500 }}>Verified</span>
              {signer && <span>· {signer}</span>}
              {signedAt && <span>· {new Date(signedAt).toLocaleString()}</span>}
              {keyHex && <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>· 0x{keyHex}</span>}
              <button
                onClick={() => updateAttributes({ signed: null, signedAt: null, keyHex: null })}
                style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 11 }}
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              {signer ? `Awaiting signature from ${signer}` : "Awaiting signature"}
            </span>
            <button
              onClick={sign}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "7px 16px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              Sign
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const Signature = Node.create({
  name: "signature",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      signer: { default: "" },
      signed: { default: null },
      signedAt: { default: null },
      keyHex: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-signature]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { signer, signed, signedAt, keyHex } = HTMLAttributes as Record<string, string>;
    // Print/export-fidelity markup that mirrors the on-screen signature block.
    const children: (string | object)[] = [
      ["div", { style: "font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#888;margin-bottom:6px" }, "Signature"],
    ];
    if (signed) {
      children.push([
        "div",
        { style: "font-family:var(--font-signature),'Segoe Script','Brush Script MT',cursive;font-size:32px;line-height:1.1;color:#1d1d1f" },
        signed,
      ]);
      const meta = [
        "Verified",
        signer ? `· ${signer}` : "",
        signedAt ? `· ${new Date(Number(signedAt)).toLocaleString()}` : "",
        keyHex ? `· 0x${keyHex}` : "",
      ].filter(Boolean).join(" ");
      children.push(["div", { style: "font-size:11px;color:#666;margin-top:8px" }, meta]);
    } else {
      children.push(["div", { style: "font-size:13px;color:#999" }, signer ? `Awaiting signature from ${signer}` : "Awaiting signature"]);
    }
    return [
      "div",
      mergeAttributes({ "data-signature": "", style: "border:1.5px dashed #c9c9cf;border-radius:12px;padding:16px 18px;margin:1.2em 0" }),
      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SignatureView);
  },

  addCommands() {
    return {
      setSignature:
        (signer = "") =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { signer } }).run(),
    };
  },
});
