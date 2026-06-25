"use client";

import { useEffect } from "react";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";

export function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3400);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 46,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 9,
        maxWidth: 460,
        padding: "10px 16px",
        borderRadius: 999,
        background: "var(--bg-elev-3)",
        border: "1px solid var(--border-strong)",
        color: "var(--text)",
        fontSize: 13,
        boxShadow: "0 12px 30px rgba(0,0,0,0.36)",
      }}
    >
      <Info size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
      {toast}
    </div>
  );
}
