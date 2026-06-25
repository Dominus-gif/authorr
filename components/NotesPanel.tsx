"use client";

import { useEffect, useRef } from "react";
import { ImagePlus } from "lucide-react";
import { useStore } from "@/lib/store";

/** Notes & research: a rich contenteditable surface that accepts pasted images
 *  and clipboard content (HTML or files), stored as HTML in `store.notes`. */
export function NotesPanel() {
  const notes = useStore((s) => s.notes);
  const setNotes = useStore((s) => s.setNotes);
  const ref = useRef<HTMLDivElement>(null);

  // Initialise once (uncontrolled) so the caret doesn't jump on every keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== notes) ref.current.innerHTML = notes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => setNotes(ref.current?.innerHTML ?? "");

  const insertImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      document.execCommand("insertHTML", false, `<img src="${reader.result}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block;" />`);
      sync();
    };
    reader.readAsDataURL(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of Array.from(items)) {
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          insertImageFile(file);
          return;
        }
      }
    }
    // Otherwise let the browser paste rich/plain content; capture it after.
    setTimeout(sync, 0);
  };

  const onDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      e.preventDefault();
      files.forEach(insertImageFile);
    }
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) {
        ref.current?.focus();
        insertImageFile(f);
      }
    };
    input.click();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 12px 0" }}>
        <button
          onClick={pickImage}
          title="Add image"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", padding: "4px 9px", borderRadius: 7, border: "1px solid var(--border)" }}
        >
          <ImagePlus size={14} /> Image
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={onPaste}
        onDrop={onDrop}
        data-placeholder="Jot research, outlines, links… paste or drop images too"
        className="notes-editable"
        style={{
          flex: 1,
          overflowY: "auto",
          outline: "none",
          color: "var(--text-secondary)",
          padding: "10px 20px 20px",
          fontSize: 14,
          lineHeight: 1.7,
          fontFamily: "var(--font-sans)",
        }}
      />
    </div>
  );
}
