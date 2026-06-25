"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";

/** In-app replacement for window.prompt / window.confirm. */
export function PromptDialog() {
  const cfg = useStore((s) => s.promptDialog);
  const close = useStore((s) => s.closePrompt);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(cfg?.defaultValue ?? "");
    if (cfg) {
      const t = setTimeout(() => (cfg.multiline ? areaRef.current : inputRef.current)?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [cfg]);

  if (!cfg) return null;
  const isInput = cfg.input !== false;

  const submit = () => {
    cfg.onSubmit(value);
    close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
      onClick={close}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{cfg.title}</span>
          <button onClick={close} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {cfg.message && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: isInput ? 14 : 0 }}>
              {cfg.message}
            </p>
          )}
          {isInput && (
            <>
              {cfg.label && (
                <label style={{ fontSize: 12, color: "var(--text-tertiary)", display: "block", marginBottom: 7 }}>{cfg.label}</label>
              )}
              {cfg.multiline ? (
                <textarea
                  ref={areaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
                  placeholder={cfg.placeholder}
                  rows={3}
                  style={field()}
                />
              ) : (
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  placeholder={cfg.placeholder}
                  style={field()}
                />
              )}
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button onClick={close} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}>
              Cancel
            </button>
            <button onClick={submit} style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 9, color: "var(--accent-contrast)", background: "var(--accent)" }}>
              {cfg.confirmLabel ?? (isInput ? "Save" : "Confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function field(): React.CSSProperties {
  return {
    width: "100%",
    fontSize: 14,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 9,
    color: "var(--text)",
    padding: "9px 12px",
    outline: "none",
    fontFamily: "var(--font-sans)",
    resize: "vertical",
  };
}
