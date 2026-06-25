"use client";

import { useState } from "react";
import {
  UserCircle2, X, User as UserIcon,
  CreditCard, KeyRound, Plus, Trash2, Check, Crown, Users, Pencil,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLE_META } from "@/lib/types";
import { PLAN_META, PLAN_ORDER, planAllows, type Plan } from "@/lib/plans";

type Tab = "profile" | "billing" | "keys";

/** Bottom-left account center (relocated from the top bar): profile + identity,
 *  billing/plan, and the AI API Key Management System. Auth is simulated locally;
 *  real accounts & Google OAuth arrive with the backend. */
export function AccountDialog() {
  const open = useStore((s) => s.accountOpen);
  const setOpen = useStore((s) => s.setAccountOpen);
  const [tab, setTab] = useState<Tab>("profile");

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Account" onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 100%)", maxHeight: "calc(100vh - 48px)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <UserCircle2 size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Account center</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 14px 0" }}>
          {([["profile", "Profile", UserIcon], ["billing", "Subscription", CreditCard], ["keys", "API keys", KeyRound]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", fontSize: 12.5, fontWeight: 500, padding: "8px 0", borderRadius: 8, color: tab === id ? "var(--accent-contrast)" : "var(--text-secondary)", background: tab === id ? "var(--accent)" : "var(--bg-elev-2)" }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, overflowY: "auto" }}>
          {tab === "profile" && <ProfileTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "keys" && <KeysTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const showToast = useStore((s) => s.showToast);
  const me = users.find((u) => u.id === currentUserId);
  // The "View as" identity simulation is an admin-only audit tool.
  const isAdmin = me?.role === "author";

  return (
    <>
      {me && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, borderRadius: 11, background: "var(--bg-elev-2)", border: "1px solid var(--border)", marginBottom: 16 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: me.color, color: "#16161a", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{me.name.charAt(0)}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{me.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Signed in · {ROLE_META[me.role].label}</div>
          </div>
        </div>
      )}

      {/* Identity switcher — admins only (security-audit "view as"). */}
      {isAdmin ? (
        <>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
            <Users size={13} /> View as · security audit
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {users.map((u) => {
              const active = u.id === currentUserId;
              return (
                <button key={u.id} onClick={() => { setCurrentUser(u.id); showToast(`Now viewing as ${u.name} (${u.role}).`); }}
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 8px", borderRadius: 8, textAlign: "left", background: active ? "var(--accent-soft)" : "transparent", border: active ? "1px solid var(--accent)" : "1px solid transparent" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: u.color, color: "#16161a", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{u.name.charAt(0)}</span>
                  <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: 12.5, color: "var(--text)" }}>{u.name}</span>
                    <span style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{ROLE_META[u.role].label}</span>
                  </span>
                  {active && <Check size={14} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12, lineHeight: 1.5 }}>Switch identity to audit how each role sees the workspace. Visible to administrators only.</p>
        </>
      ) : (
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>Manage your billing and API keys from the tabs above. Profile editing &amp; sign-out arrive with the backend.</p>
      )}
    </>
  );
}

function BillingTab() {
  const plan = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const showToast = useStore((s) => s.showToast);

  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
        You're on the <strong style={{ color: "var(--text)" }}>{PLAN_META[plan].name}</strong> plan.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLAN_ORDER.map((p) => {
          const m = PLAN_META[p];
          const active = plan === p;
          return (
            <div key={p} style={{ border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev-2)", borderRadius: 12, padding: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p !== "free" && <Crown size={15} style={{ color: "var(--accent)" }} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{m.price}</span>
                {active && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>Current</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", margin: "5px 0 10px" }}>{m.tagline}</div>
              {!active && (
                <button onClick={() => { setPlan(p); showToast(`Switched to the ${m.name} plan.`); }}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: p === "free" ? "var(--text-secondary)" : "var(--accent-contrast)", background: p === "free" ? "transparent" : "var(--accent)", border: p === "free" ? "1px solid var(--border-strong)" : "none" }}>
                  {PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(plan) ? `Upgrade to ${m.name}` : `Switch to ${m.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>Prototype: plan changes are instant &amp; local. Real billing arrives with the backend.</p>
    </>
  );
}

function KeysTab() {
  const plan = useStore((s) => s.plan);
  const requireFeature = useStore((s) => s.requireFeature);
  const apiKeys = useStore((s) => s.apiKeys);
  const activeApiKeyId = useStore((s) => s.activeApiKeyId);
  const addApiKey = useStore((s) => s.addApiKey);
  const deleteApiKey = useStore((s) => s.deleteApiKey);
  const renameApiKey = useStore((s) => s.renameApiKey);
  const setActiveApiKey = useStore((s) => s.setActiveApiKey);
  const openPrompt = useStore((s) => s.openPrompt);
  const showToast = useStore((s) => s.showToast);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");

  const unlocked = planAllows(plan, "keyManagement");

  if (!unlocked) {
    return (
      <div style={{ textAlign: "center", padding: "18px 8px" }}>
        <KeyRound size={26} style={{ color: "var(--text-tertiary)", marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Key Management is a Pro feature</div>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
          Add, rename and organize your own AI API keys on Pro or Team. The app default key powers the AI suite until you switch to your own.
        </p>
        <button onClick={() => requireFeature("keyManagement")} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: "var(--accent-contrast)", background: "var(--accent)" }}>Upgrade to Pro</button>
      </div>
    );
  }

  const mask = (k: string) => (k.length <= 8 ? "••••" : k.slice(0, 3) + "••••••" + k.slice(-4));
  const add = () => {
    if (!secret.trim()) { showToast("Paste an API key first."); return; }
    addApiKey(name, secret);
    setName(""); setSecret("");
    showToast("API key added.");
  };

  return (
    <>
      {/* Default vs own key toggle */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 11, padding: 12, marginBottom: 14, background: "var(--bg-elev-2)" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Which key powers the AI suite</div>
        <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }}>
          <input type="radio" name="apikey" checked={activeApiKeyId === null} onChange={() => { setActiveApiKey(null); showToast("Using the app default key."); }} style={{ accentColor: "var(--accent)" }} />
          <span style={{ fontSize: 12.5, color: "var(--text)" }}>App default key <span style={{ color: "var(--text-tertiary)" }}>(active until you switch)</span></span>
        </label>
        {apiKeys.map((k) => (
          <label key={k.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }}>
            <input type="radio" name="apikey" checked={activeApiKeyId === k.id} onChange={() => { setActiveApiKey(k.id); showToast(`Using "${k.name}".`); }} style={{ accentColor: "var(--accent)" }} />
            <span style={{ fontSize: 12.5, color: "var(--text)", flex: 1 }}>{k.name} <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{mask(k.key)}</span></span>
          </label>
        ))}
      </div>

      {/* Manage keys */}
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>Your keys</div>
      {apiKeys.length === 0 && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>No keys yet — add one below.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {apiKeys.map((k) => (
          <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg-elev-2)" }}>
            <KeyRound size={14} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "var(--text)" }}>{k.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{mask(k.key)}</div>
            </div>
            <button title="Rename" onClick={() => openPrompt({ title: "Rename key", label: "Name", defaultValue: k.name, onSubmit: (v) => v && renameApiKey(k.id, v) })} style={{ color: "var(--text-tertiary)", display: "flex", padding: 4 }}><Pencil size={13} /></button>
            <button title="Delete" onClick={() => { deleteApiKey(k.id); showToast("Key removed."); }} style={{ color: "var(--danger)", display: "flex", padding: 4 }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* Add key */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. Personal Claude)" style={{ padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 12.5, outline: "none" }} />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="sk-ant-…" style={{ padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 12.5, fontFamily: "var(--font-mono)", outline: "none" }} />
        <button onClick={add} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: "var(--accent-contrast)", background: "var(--accent)" }}>
          <Plus size={15} /> Add key
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>Keys are stored locally for this prototype. Real secrets need a backend vault.</p>
    </>
  );
}
