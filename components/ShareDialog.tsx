"use client";

import { useState } from "react";
import { Share2, X, Copy, Check, Globe, Lock, Timer, Eye } from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";
import { SHARE_META, type ShareVisibility } from "@/lib/types";
import { SharePreview } from "./SharePreview";

const VIS: { id: ShareVisibility; icon: typeof Globe }[] = [
  { id: "public", icon: Globe },
  { id: "private", icon: Lock },
  { id: "onetime", icon: Timer },
];

const EXPIRY_OPTIONS: { label: string; ms: number | null }[] = [
  { label: "Never", ms: null },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

export function ShareDialog() {
  const open = useStore((s) => s.shareDialogOpen);
  const setOpen = useStore((s) => s.setShareDialogOpen);
  const doc = useStore(selectActiveDoc);
  const shares = useStore((s) => s.shares);
  const setShare = useStore((s) => s.setShare);
  const setShareExpiry = useStore((s) => s.setShareExpiry);
  const accessRequests = useStore((s) => s.accessRequests);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);

  if (!open || !doc) return null;

  const share = shares[doc.id];
  const link = share ? `https://easyframe.app/s/${share.token}` : "";
  const docRequests = accessRequests.filter((r) => r.docId === doc.id);

  const choose = (v: ShareVisibility) => setShare(doc.id, v);
  const copy = () => {
    if (link) navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share note"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Share2 size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Share “{doc.name}”</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>Link visibility</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {VIS.map(({ id, icon: Icon }) => {
              const active = share?.visibility === id;
              const meta = SHARE_META[id];
              return (
                <button
                  key={id}
                  onClick={() => choose(id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, textAlign: "left", border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)" }}
                >
                  <Icon size={16} style={{ color: active ? "var(--accent)" : "var(--text-secondary)", flexShrink: 0 }} />
                  <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{meta.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{meta.desc}</span>
                  </span>
                  {active && <Check size={15} color="var(--accent)" />}
                </button>
              );
            })}
          </div>

          {share && share.visibility === "public" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
                <Timer size={13} /> Link expires after
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EXPIRY_OPTIONS.map((opt) => {
                  const active =
                    opt.ms === null
                      ? !share.expiresAt
                      : !!share.expiresAt && Math.abs(share.expiresAt - (Date.now() + opt.ms)) < 60000;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setShareExpiry(doc.id, opt.ms)}
                      style={{ fontSize: 12, padding: "5px 11px", borderRadius: 999, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)", color: active ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {share.expiresAt && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
                  Access ends {new Date(share.expiresAt).toLocaleString()}.
                </div>
              )}
            </div>
          )}

          {share && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                <input readOnly value={link} style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", padding: "8px 10px", outline: "none" }} />
                <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", color: copied ? "var(--success)" : "var(--text-secondary)" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <button onClick={() => setPreview(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 10, border: "1px solid var(--border-strong)", color: "var(--text-secondary)", fontSize: 13 }}>
                <Eye size={15} /> Preview recipient view
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10, lineHeight: 1.5 }}>
                Recipients open a read-only webpage. To edit they must sign in and
                request access — you approve it, and a unique 8-digit ID is issued for
                that person + this document. (Real cross-device links arrive with the backend.)
              </p>
            </>
          )}

          {docRequests.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>Access requests</div>
              {docRequests.map((r) => (
                <div key={r.id} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "6px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--text)" }}>{r.requesterName}</span>
                  <span style={{ marginLeft: "auto", color: r.status === "accepted" ? "var(--success)" : r.status === "denied" ? "var(--danger)" : "var(--warning)" }}>
                    {r.status === "accepted" ? `ID ${r.accessId}` : r.status === "denied" ? "Denied" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {preview && <SharePreview doc={doc} onClose={() => setPreview(false)} />}
    </div>
  );
}
