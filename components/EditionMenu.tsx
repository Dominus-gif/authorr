"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, User as UserIcon, Check, ChevronDown, Users, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDropdownPos } from "@/lib/useDropdownPos";
import type { Edition } from "@/lib/types";

export function EditionMenu() {
  const edition = useStore((s) => s.edition);
  const setEdition = useStore((s) => s.setEdition);
  const teamPlan = useStore((s) => s.plan === "team");
  const collabUnlocked = useStore((s) => s.collabUnlocked);
  const setCollabDialogOpen = useStore((s) => s.setCollabDialogOpen);
  const setUpgradePrompt = useStore((s) => s.setUpgradePrompt);
  const showToast = useStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pos = useDropdownPos(open, btnRef, 264);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // On the Team plan the app is always a shared workspace — display Workspace
  // and don't allow switching back to Personal.
  const isWorkspace = edition === "workspace" || teamPlan;

  const pick = (e: Edition) => {
    if (teamPlan && e === "personal") {
      showToast("Your Team plan is always in the workspace.");
      return;
    }
    setEdition(e);
    setOpen(false);
    showToast(e === "workspace" ? "Workspace edition — full collaboration enabled." : "Personal edition.");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="App edition"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 30,
          padding: "0 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          border: "1px solid var(--border)",
          color: isWorkspace ? "var(--accent)" : "var(--text-secondary)",
          background: isWorkspace ? "var(--accent-soft)" : "var(--bg-elev-2)",
        }}
      >
        {isWorkspace ? <Building2 size={14} /> : <UserIcon size={14} />}
        {isWorkspace ? "Workspace" : "Personal"}
        <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} />
      </button>

      {open && pos && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 1000,
            width: 264,
            maxHeight: pos.maxHeight,
            overflowY: "auto",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          <EditionRow
            icon={<UserIcon size={15} />}
            label="Personal"
            desc={teamPlan ? "Locked — your Team plan is workspace-only" : "All core features · collaboration via invite"}
            active={!isWorkspace}
            disabled={teamPlan}
            onClick={() => pick("personal")}
          />
          <EditionRow
            icon={<Building2 size={15} />}
            label="Workspace"
            desc="Teams · real-time multi-user editing"
            active={isWorkspace}
            onClick={() => pick("workspace")}
          />

          <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />

          <button
            onClick={() => { setOpen(false); setCollabDialogOpen(true); }}
            style={rowBtn()}
          >
            <Users size={15} style={{ color: "var(--text-secondary)" }} />
            <span style={{ flex: 1, textAlign: "left" }}>Manage collaboration</span>
            {!isWorkspace && (
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "var(--bg-elev-3)", color: collabUnlocked ? "var(--success)" : "var(--text-tertiary)" }}>
                {collabUnlocked ? "Unlocked" : "Locked"}
              </span>
            )}
          </button>

          {!isWorkspace && (
            <button
              onClick={() => { setOpen(false); setUpgradePrompt("real-time team collaboration"); }}
              style={{ ...rowBtn(), color: "var(--accent)" }}
            >
              <Sparkles size={15} />
              <span style={{ flex: 1, textAlign: "left" }}>Upgrade to Workspace</span>
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function EditionRow({ icon, label, desc, active, onClick, disabled }: { icon: React.ReactNode; label: string; desc: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 8, textAlign: "left", background: active ? "var(--accent-soft)" : "transparent", opacity: disabled ? 0.55 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
      <span style={{ color: active ? "var(--accent)" : "var(--text-secondary)", display: "flex" }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{desc}</span>
      </span>
      {active && <Check size={15} color="var(--accent)" />}
    </button>
  );
}

function rowBtn(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "8px 9px",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--text)",
  };
}
