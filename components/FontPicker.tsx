"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Type } from "lucide-react";
import { useStore } from "@/lib/store";
import { FONT_LIBRARY } from "@/lib/fonts";
import { useEditorInstance } from "./EditorContext";

export function FontPicker() {
  const font = useStore((s) => s.font);
  const setFont = useStore((s) => s.setFont);
  const showToast = useStore((s) => s.showToast);
  const editor = useEditorInstance();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // When text is selected, reflect that selection's applied font (not the
  // global default) so the picker always shows the correct font.
  const selStack =
    editor && !editor.state.selection.empty
      ? (editor.getAttributes("textStyle").fontFamily as string | undefined)
      : undefined;
  const globalCurrent = FONT_LIBRARY.find((f) => f.id === font) ?? FONT_LIBRARY[0];
  const current = selStack
    ? FONT_LIBRARY.find((f) => f.stack === selStack) ?? { ...globalCurrent, label: "Custom", stack: selStack }
    : globalCurrent;

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = 232;
      setCoords({
        left: Math.min(r.left, window.innerWidth - width - 8),
        top: r.bottom + 6,
      });
    }
    setOpen((o) => !o);
  };

  const choose = (id: string, stack: string, label: string) => {
    const hasSelection = !!editor && !editor.state.selection.empty;
    if (hasSelection) {
      editor!.chain().focus().setFontFamily(stack).run();
      showToast(`${label} applied to selection.`);
    } else {
      setFont(id);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Reading font"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 9px",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Type size={15} />
        <span style={{ fontFamily: current.stack, maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current.label}
        </span>
        <ChevronDown size={13} style={{ color: "var(--text-tertiary)" }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Reading font"
          style={{
            position: "fixed",
            left: coords.left,
            top: coords.top,
            zIndex: 80,
            width: 232,
            maxHeight: 360,
            overflowY: "auto",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          {FONT_LIBRARY.map((f) => {
            const active = selStack ? f.stack === selStack : f.id === font;
            return (
              <button
                key={f.id}
                role="option"
                aria-selected={active}
                onClick={() => choose(f.id, f.stack, f.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 9px",
                  borderRadius: 8,
                  textAlign: "left",
                  background: active ? "var(--accent-soft)" : "transparent",
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.background = "var(--bg-elev-3)")}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: f.stack, fontSize: 16, color: "var(--text)" }}>
                    {f.label}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{f.note}</span>
                </span>
                {active && <Check size={15} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
