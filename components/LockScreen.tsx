"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TreeNode } from "@/lib/types";

export function LockScreen({ doc }: { doc: TreeNode }) {
  const unlockDoc = useStore((s) => s.unlockDoc);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (unlockDoc(doc.id, code)) {
      setCode("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elev-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
        <Lock size={24} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>{doc.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>This note is passcode-protected.</div>
      </div>
      <div style={{ display: "flex", gap: 8, width: "min(320px, 100%)" }}>
        <input
          autoFocus
          type="password"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter passcode"
          style={{
            flex: 1,
            fontSize: 14,
            background: "var(--bg-elev)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border-strong)"}`,
            borderRadius: 10,
            color: "var(--text)",
            padding: "10px 14px",
            outline: "none",
          }}
        />
        <button onClick={submit} style={{ fontSize: 14, fontWeight: 500, padding: "0 18px", borderRadius: 10, background: "var(--accent)", color: "var(--accent-contrast)" }}>
          Unlock
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: "var(--danger)" }}>Incorrect passcode. Try again.</div>}
    </div>
  );
}
