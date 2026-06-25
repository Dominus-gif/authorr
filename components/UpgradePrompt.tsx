"use client";

import { Sparkles, X, Check } from "lucide-react";
import { useStore } from "@/lib/store";

const WORKSPACE_PERKS = [
  "Real-time collaborative editing (Google-Docs-style)",
  "Multi-user workspaces & team management",
  "Unlimited @mentions and live edit requests",
  "Workspace-level roles & permissions",
];

export function UpgradePrompt() {
  const feature = useStore((s) => s.upgradePrompt);
  const setUpgradePrompt = useStore((s) => s.setUpgradePrompt);
  const setEdition = useStore((s) => s.setEdition);
  const showToast = useStore((s) => s.showToast);

  if (!feature) return null;

  const upgrade = () => {
    setEdition("workspace");
    setUpgradePrompt(null);
    showToast("Switched to the Workspace edition — collaboration enabled.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Workspace"
      onClick={() => setUpgradePrompt(null)}
      style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--accent)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Sparkles size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Workspace feature</span>
          <button onClick={() => setUpgradePrompt(null)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 14 }}>
            <span style={{ fontWeight: 500 }}>{feature}</span> {feature.endsWith("s") ? "are" : "is"} part of the
            Workspace edition, built for teams and organizations.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {WORKSPACE_PERKS.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <Check size={15} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                {p}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setUpgradePrompt(null)} style={{ flex: 1, fontSize: 13, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
              Not now
            </button>
            <button onClick={upgrade} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, fontWeight: 500, padding: "10px 0", borderRadius: 10, background: "var(--accent)", color: "var(--accent-contrast)" }}>
              <Sparkles size={15} /> Upgrade to Workspace
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12, textAlign: "center" }}>
            Prototype: switching is instant & local. Real billing/SSO arrives with the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
