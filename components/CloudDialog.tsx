"use client";

import { Cloud, X, Check, HardDrive, Clock } from "lucide-react";
import { useStore } from "@/lib/store";

const PROVIDERS: { id: string; label: string; color: string; account: string }[] = [
  { id: "gdrive", label: "Google Drive", color: "#1a73e8", account: "you@gmail.com" },
  { id: "dropbox", label: "Dropbox", color: "#0061ff", account: "you@dropbox" },
  { id: "onedrive", label: "OneDrive", color: "#0364b8", account: "you@outlook.com" },
  { id: "icloud", label: "iCloud Drive", color: "#3693f3", account: "you@icloud.com" },
  { id: "box", label: "Box", color: "#0061d5", account: "you@box.com" },
];

const INTERVALS = [1, 2, 5, 10, 30];

export function CloudDialog() {
  const open = useStore((s) => s.cloudDialogOpen);
  const setOpen = useStore((s) => s.setCloudDialogOpen);
  const connected = useStore((s) => s.connectedClouds);
  const toggleCloud = useStore((s) => s.toggleCloud);
  const autosaveEnabled = useStore((s) => s.autosaveEnabled);
  const autosaveMinutes = useStore((s) => s.autosaveMinutes);
  const setAutosave = useStore((s) => s.setAutosave);
  const showToast = useStore((s) => s.showToast);

  if (!open) return null;

  const connect = (id: string, label: string) => {
    const wasConnected = connected.includes(id);
    toggleCloud(id);
    showToast(wasConnected ? `Disconnected from ${label}.` : `Connected to ${label} — updates will sync here.`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cloud storage & autosave"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Cloud size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Cloud storage & autosave</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
            <HardDrive size={14} /> Connect remote storage
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PROVIDERS.map((p) => {
              const isOn = connected.includes(p.id);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 11, border: isOn ? "1px solid var(--accent)" : "1px solid var(--border)", background: isOn ? "var(--accent-soft)" : "var(--bg-elev-2)" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: p.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {p.label.charAt(0)}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{p.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{isOn ? `Connected · ${p.account}` : "Not connected"}</div>
                  </div>
                  <button
                    onClick={() => connect(p.id, p.label)}
                    style={{ fontSize: 12.5, fontWeight: 500, padding: "6px 13px", borderRadius: 8, display: "flex", alignItems: "center", gap: 5, ...(isOn ? { color: "var(--success)", border: "1px solid var(--border-strong)" } : { color: "var(--accent-contrast)", background: "var(--accent)" }) }}
                  >
                    {isOn ? <><Check size={14} /> Connected</> : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10, lineHeight: 1.5 }}>
            Account linking is simulated here — real OAuth + sync to these providers arrives with the backend (services phase).
          </p>

          <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
            <Clock size={14} /> Automatic save
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={autosaveEnabled} onChange={(e) => setAutosave(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
            <span style={{ fontSize: 13.5, color: "var(--text)" }}>Auto-save on a timer</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: autosaveEnabled ? 1 : 0.5, pointerEvents: autosaveEnabled ? "auto" : "none" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Every</span>
            {INTERVALS.map((m) => (
              <button
                key={m}
                onClick={() => setAutosave(true, m)}
                style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 999, border: autosaveMinutes === m ? "1px solid var(--accent)" : "1px solid var(--border)", background: autosaveMinutes === m ? "var(--accent-soft)" : "var(--bg-elev-2)", color: autosaveMinutes === m ? "var(--accent)" : "var(--text-secondary)" }}
              >
                {m} min
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10 }}>
            Edits already save instantly to your device; this also snapshots a version{connected.length ? " and syncs to your connected cloud" : ""} on the chosen interval.
          </p>
        </div>
      </div>
    </div>
  );
}
