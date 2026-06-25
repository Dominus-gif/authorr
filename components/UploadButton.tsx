"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseEF } from "@/lib/efformat";
import type { TreeNode } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Upload a .ef file and open it directly into the editor. */
export function UploadButton() {
  const importDoc = useStore((s) => s.importDoc);
  const showToast = useStore((s) => s.showToast);
  const openPrompt = useStore((s) => s.openPrompt);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const res = parseEF(text);
    if (!res.payload) {
      showToast(res.error ?? "Could not read that .ef file.");
      return;
    }
    const p = res.payload;
    const openIt = () => {
      const node: TreeNode = {
        id: "d-" + uid(),
        type: "doc",
        name: p.doc.name || "Uploaded document",
        status: p.doc.status ?? "draft",
        updatedAt: Date.now(),
        content: p.content.html,
        createdAt: Date.now(),
      };
      importDoc(node);
      showToast(`Opened “${node.name}”.`);
    };
    if (res.tampered) {
      openPrompt({
        title: "Integrity check failed",
        message: "This .ef may have been modified outside EasyFrame. Open it anyway?",
        input: false,
        confirmLabel: "Open anyway",
        onSubmit: openIt,
      });
    } else {
      openIt();
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".ef" onChange={onFile} style={{ display: "none" }} />
      <button
        title="Upload .ef"
        aria-label="Upload .ef file"
        onClick={() => fileRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Upload size={17} />
      </button>
    </>
  );
}
