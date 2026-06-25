"use client";

import { useState } from "react";
import { Users, X, Copy, Check, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

export function CollabDialog() {
  const open = useStore((s) => s.collabDialogOpen);
  const setOpen = useStore((s) => s.setCollabDialogOpen);
  const edition = useStore((s) => s.edition);
  const collabUnlocked = useStore((s) => s.collabUnlocked);
  const generatedInvite = useStore((s) => s.generatedInvite);
  const generateInvite = useStore((s) => s.generateInvite);
  const acceptInvite = useStore((s) => s.acceptInvite);
  const showToast = useStore((s) => s.showToast);
  const setUpgradePrompt = useStore((s) => s.setUpgradePrompt);

  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const copy = () => {
    if (generatedInvite) navigator.clipboard?.writeText(generatedInvite);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const accept = () => {
    const result = acceptInvite(code);
    if (result === "ok") {
      showToast("Collaboration unlocked for this space.");
      setOpen(false);
    } else if (result === "limit") {
      showToast("Personal plan limit reached (5 collaborators). Upgrade to Workspace for more.");
    } else {
      setError(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collaboration"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Users size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Collaboration</span>
          <span style={{ fontSize: 11, marginLeft: 4, padding: "2px 8px", borderRadius: 999, background: "var(--bg-elev-3)", color: collabUnlocked ? "var(--success)" : "var(--text-tertiary)" }}>
            {edition === "workspace" ? "Workspace" : collabUnlocked ? "Unlocked" : "Locked"}
          </span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {edition === "workspace" || collabUnlocked ? (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Collaboration is active. You can @mention teammates and assign edit
              requests. {edition === "personal" && "Limited to invited collaborators on this Personal plan."}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              On the Personal plan, collaboration unlocks once you invite someone and
              they accept your code. For full real-time team editing,{" "}
              <button onClick={() => { setOpen(false); setUpgradePrompt("real-time team collaboration"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
                upgrade to Workspace
              </button>.
            </p>
          )}

          {/* Invite */}
          <div style={{ marginTop: 8, padding: 14, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Invite a collaborator</div>
            {generatedInvite ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 18, letterSpacing: 2, color: "var(--accent)", background: "var(--bg)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  {generatedInvite}
                </code>
                <button onClick={copy} title="Copy" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", color: copied ? "var(--success)" : "var(--text-secondary)" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <button onClick={() => generateInvite()} style={{ fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 8, background: "var(--accent)", color: "var(--accent-contrast)" }}>
                Generate invite code
              </button>
            )}
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
              Share this 8-character code. The recipient enters it below to gain access.
            </p>
          </div>

          {/* Accept */}
          <div style={{ marginTop: 12, padding: 14, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Have an invite code?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(false); }}
                placeholder="8-CHAR CODE"
                maxLength={8}
                style={{ flex: 1, fontFamily: "var(--font-mono)", letterSpacing: 2, fontSize: 14, background: "var(--bg)", border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`, borderRadius: 8, color: "var(--text)", padding: "8px 12px", outline: "none" }}
              />
              <button onClick={accept} style={{ fontSize: 13, fontWeight: 500, padding: "0 16px", borderRadius: 8, background: "var(--bg-elev-3)", color: "var(--text)", border: "1px solid var(--border-strong)" }}>
                Accept
              </button>
            </div>
            {error && <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>That code doesn’t match. Generate one above to test the flow.</p>}
          </div>

          {edition === "personal" && (
            <button
              onClick={() => { setOpen(false); setUpgradePrompt("real-time team collaboration"); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10, border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 13, fontWeight: 500 }}
            >
              <Sparkles size={15} /> Upgrade to Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
