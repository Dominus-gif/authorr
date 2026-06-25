"use client";

import { useState } from "react";
import { Lock, X, Unlock, Clock } from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";

const TIMEOUTS = [1, 3, 5, 10, 30];

export function PasscodeDialog() {
  const open = useStore((s) => s.passcodeDialogOpen);
  const setOpen = useStore((s) => s.setPasscodeDialogOpen);
  const doc = useStore(selectActiveDoc);
  const setPasscode = useStore((s) => s.setPasscode);
  const clearPasscode = useStore((s) => s.clearPasscode);
  const autoLockMinutes = useStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useStore((s) => s.setAutoLockMinutes);
  const showToast = useStore((s) => s.showToast);

  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (!open || !doc) return null;
  const hasPasscode = !!doc.passcodeHash;

  const save = () => {
    if (code.length < 4) return setError("Use at least 4 characters.");
    if (code !== confirm) return setError("Passcodes don’t match.");
    setPasscode(doc.id, code);
    showToast("Passcode set — this note is now protected.");
    setOpen(false);
  };

  const remove = () => {
    clearPasscode(doc.id);
    showToast("Passcode removed.");
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Passcode protection"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Lock size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Passcode protection</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {hasPasscode ? (
            <>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
                “{doc.name}” is protected. It locks automatically after inactivity and
                requires the passcode to open.
              </p>
              <button onClick={remove} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--border-strong)", color: "var(--danger)" }}>
                <Unlock size={15} /> Remove passcode
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
                Set a passcode for “{doc.name}”. It can’t be opened without it.
              </p>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="Passcode"
                style={inp(!!error)}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Confirm passcode"
                style={{ ...inp(!!error), marginTop: 8 }}
              />
              {error && <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>{error}</p>}
              <button onClick={save} style={{ width: "100%", marginTop: 12, fontSize: 13, fontWeight: 500, padding: "9px 0", borderRadius: 9, background: "var(--accent)", color: "var(--accent-contrast)" }}>
                Set passcode
              </button>
            </>
          )}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
              <Clock size={14} /> Auto-lock after inactivity
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TIMEOUTS.map((m) => (
                <button
                  key={m}
                  onClick={() => setAutoLockMinutes(m)}
                  style={{
                    fontSize: 12,
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: autoLockMinutes === m ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: autoLockMinutes === m ? "var(--accent-soft)" : "var(--bg-elev-2)",
                    color: autoLockMinutes === m ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function inp(error: boolean): React.CSSProperties {
  return {
    width: "100%",
    fontSize: 14,
    background: "var(--bg)",
    border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
    borderRadius: 9,
    color: "var(--text)",
    padding: "9px 12px",
    outline: "none",
  };
}
