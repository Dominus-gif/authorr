"use client";

import { Sparkles, X, Check, Crown } from "lucide-react";
import { useStore } from "@/lib/store";
import { FEATURE_LABEL, PLAN_META, requiredPlan, type Feature, type Plan } from "@/lib/plans";

const PRO_PERKS = [
  "Full AI editing suite + your own API keys",
  "Templates, paper textures & page layouts",
  "Version history, recovery & passcodes",
  "PDF / Word export and every theme",
];
const TEAM_PERKS = [
  "Everything in Pro, for your whole team",
  "Real-time collaboration & document sharing",
  "Roles, edit-request review & the Team dashboard",
  "Centralized workspace management",
];

/** Plan-gating upgrade modal. Driven by `store.gate`; targets Pro (or Team for
 *  collaboration features). Switching plans is instant + local in this prototype. */
export function PlanUpgradeModal() {
  const gate = useStore((s) => s.gate);
  const closeGate = useStore((s) => s.closeGate);
  const setPlan = useStore((s) => s.setPlan);
  const showToast = useStore((s) => s.showToast);

  if (!gate) return null;

  const isStorage = gate === "storage";
  const target: Plan = isStorage ? "pro" : requiredPlan(gate as Feature);
  const meta = PLAN_META[target];
  const perks = target === "team" ? TEAM_PERKS : PRO_PERKS;
  const label = isStorage
    ? "More folders & documents"
    : FEATURE_LABEL[gate as Feature];

  const upgrade = () => {
    setPlan(target);
    closeGate();
    showToast(`Upgraded to ${meta.name} — premium features unlocked.`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Upgrade to ${meta.name}`}
      onClick={closeGate}
      style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--accent)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Crown size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.name} feature</span>
          <button onClick={closeGate} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{label}</span>{" "}
            {isStorage ? "needs more room than the Free plan allows." : "is part of the " + meta.name + " plan."}
          </p>
          <p style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginBottom: 16 }}>
            {meta.name} · {meta.price} — {meta.tagline}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            {perks.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <Check size={15} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                {p}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={closeGate} style={{ flex: 1, fontSize: 13, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
              Not now
            </button>
            <button onClick={upgrade} style={{ flex: 1.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, fontWeight: 600, padding: "10px 0", borderRadius: 10, background: "var(--accent)", color: "var(--accent-contrast)" }}>
              <Sparkles size={15} /> Upgrade to {meta.name}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12, textAlign: "center" }}>
            Prototype: upgrading is instant &amp; local. Real billing arrives with the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
