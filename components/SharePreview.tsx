"use client";

import { useState } from "react";
import { X, PenLine, LogIn } from "lucide-react";
import { useStore } from "@/lib/store";
import { SHARE_META, type TreeNode } from "@/lib/types";

/** Simulated recipient webpage for a shared link: clean read-only note +
 *  a sign-in/sign-up gate before the viewer can request edit access. */
export function SharePreview({ doc, onClose }: { doc: TreeNode; onClose: () => void }) {
  const shares = useStore((s) => s.shares);
  const requestAccess = useStore((s) => s.requestAccess);
  const [mode, setMode] = useState<"view" | "auth">("view");
  const [name, setName] = useState("");
  const [requested, setRequested] = useState(false);

  const share = shares[doc.id];
  const expired = !!share?.expiresAt && Date.now() > share.expiresAt;

  const submit = () => {
    if (!name.trim()) return;
    requestAccess(doc.id, name.trim());
    setRequested(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shared note preview"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 100%)", height: "min(640px, 90vh)", background: "#ffffff", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
        {/* Faux browser chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0f0f3", borderBottom: "1px solid #e2e2e7", flexShrink: 0 }}>
          <span style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
          </span>
          <span style={{ flex: 1, textAlign: "center", fontSize: 12, fontFamily: "var(--font-mono)", color: "#6e6e73", background: "#fff", borderRadius: 6, padding: "4px 10px", margin: "0 60px" }}>
            easyframe.app/s/{share?.token?.slice(0, 10) ?? "…"}
          </span>
          <button onClick={onClose} aria-label="Close preview" style={{ color: "#6e6e73", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {expired && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40, textAlign: "center", color: "#1d1d1f" }}>
            <X size={40} color="#e23b3b" />
            <div style={{ fontSize: 18, fontWeight: 600 }}>This link has expired</div>
            <div style={{ fontSize: 13.5, color: "#6e6e73", maxWidth: 360, lineHeight: 1.6 }}>
              The owner set this public link to expire on {share?.expiresAt ? new Date(share.expiresAt).toLocaleString() : ""}. Ask them to share a new link.
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", display: expired ? "none" : "flex", flexDirection: "column" }}>
          {/* Page header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", borderBottom: "1px solid #eee", flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f" }}>EasyFrame</span>
            <span style={{ fontSize: 11, color: "#86868b", border: "1px solid #e2e2e7", borderRadius: 999, padding: "2px 9px" }}>
              {share ? SHARE_META[share.visibility].label : "Shared"} · read-only
            </span>
            <button
              onClick={() => setMode("auth")}
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 8, background: "#0071e3", color: "#fff" }}
            >
              <PenLine size={14} /> Edit
            </button>
          </div>

          {/* Note content (read-only) */}
          <div style={{ padding: "28px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
            <div
              className="ProseMirror"
              style={{ color: "#1d1d1f", fontFamily: "var(--font-reading)" }}
              dangerouslySetInnerHTML={{ __html: doc.content ?? "" }}
            />
          </div>
        </div>

        {/* Auth gate overlay */}
        {mode === "auth" && (
          <div style={{ position: "absolute", inset: 0, top: 42, background: "rgba(245,245,247,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "min(360px, 100%)", background: "#fff", border: "1px solid #e2e2e7", borderRadius: 14, padding: 22, boxShadow: "0 12px 40px rgba(0,0,0,0.16)" }}>
              {requested ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f", marginBottom: 8 }}>Access requested</div>
                  <p style={{ fontSize: 13, color: "#6e6e73", lineHeight: 1.6 }}>
                    The author has been notified. Once they approve, you’ll receive an
                    8-digit access ID to edit this document.
                  </p>
                  <button onClick={onClose} style={{ marginTop: 16, fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 9, background: "#0071e3", color: "#fff" }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <LogIn size={16} color="#0071e3" />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f" }}>Sign in to edit</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.5, marginBottom: 14 }}>
                    Create an account or sign in, then request edit access from the author.
                  </p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Your name"
                    style={{ width: "100%", fontSize: 14, background: "#fff", border: "1px solid #d2d2d7", borderRadius: 9, color: "#1d1d1f", padding: "10px 12px", outline: "none", marginBottom: 10 }}
                  />
                  <button onClick={submit} style={{ width: "100%", fontSize: 13, fontWeight: 500, padding: "10px 0", borderRadius: 9, background: "#0071e3", color: "#fff" }}>
                    Sign up & request edit access
                  </button>
                  <button onClick={() => setMode("view")} style={{ width: "100%", fontSize: 12, color: "#6e6e73", marginTop: 8 }}>
                    Keep reading instead
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
