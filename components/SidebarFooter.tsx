"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserCircle2, LayoutTemplate, Trash2, Archive, Cloud, ChevronDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useStore } from "@/lib/store";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Bottom-left hub: account, templates, trash, archive, cloud storage. */
export function SidebarFooter() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const setAccountOpen = useStore((s) => s.setAccountOpen);
  const setTemplatesOpen = useStore((s) => s.setTemplatesOpen);
  const setTrashOpen = useStore((s) => s.setTrashOpen);
  const setArchiveOpen = useStore((s) => s.setArchiveOpen);
  const setCloudDialogOpen = useStore((s) => s.setCloudDialogOpen);
  const isFree = useStore((s) => s.plan === "free");
  const trashCount = useStore((s) => s.trash.length);
  const connectedClouds = useStore((s) => s.connectedClouds);
  const me = users.find((u) => u.id === currentUserId);

  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number } | null>(null);

  useEffect(() => {
    if (!menuOpen || !btnRef.current) { setPos(null); return; }
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ left: r.left, bottom: window.innerHeight - r.top + 6, width: r.width });
    };
    place();
    window.addEventListener("resize", place);
    const onDown = (e: MouseEvent) => { if (btnRef.current && !btnRef.current.contains(e.target as Node)) setMenuOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("mousedown", onDown); };
  }, [menuOpen]);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, badge?: string | number) => (
    <button
      onClick={() => { onClick(); setMenuOpen(false); }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 11px", borderRadius: 8, fontSize: 13, color: "var(--text)", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "var(--text-secondary)", display: "flex" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge !== "" && badge !== 0 && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 999, padding: "1px 7px" }}>{badge}</span>
      )}
    </button>
  );

  const quickBtn = (icon: React.ReactNode, label: string, onClick: () => void, badge?: number) => (
    <button
      onClick={onClick}
      title={label}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, flex: 1, padding: "8px 6px", borderRadius: 9, fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", border: "1px solid var(--border)", background: "transparent", position: "relative" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elev-2)"; e.currentTarget.style.color = "var(--text)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ position: "absolute", top: 3, right: 5, fontSize: 9.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 999, padding: "0 5px" }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: 8, position: "relative" }}>
      {/* Standalone quick buttons (not buried in the account menu) */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {/* Templates is a premium feature — hidden entirely on Free. */}
        {!isFree && quickBtn(<LayoutTemplate size={15} />, "Templates", () => setTemplatesOpen(true))}
        {quickBtn(<Trash2 size={15} />, "Trash", () => setTrashOpen(true), trashCount)}
      </div>

      <button
        ref={btnRef}
        onClick={() => setMenuOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 9px", borderRadius: 10, background: menuOpen ? "var(--bg-elev-3)" : "transparent" }}
        onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = "var(--bg-elev-2)"; }}
        onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {clerkEnabled
          ? <ClerkIdentity color={me?.color ?? "var(--accent)"} />
          : <IdentityInner color={me?.color ?? "var(--accent)"} initial={me?.name.charAt(0) ?? "?"} name={me?.name ?? "Account"} sub="Settings & account" />}
        <ChevronDown size={14} style={{ color: "var(--text-tertiary)", transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {menuOpen && pos && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: "fixed", left: pos.left, bottom: pos.bottom, width: Math.max(220, pos.width), zIndex: 1000, background: "var(--bg-elev-2)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px rgba(0,0,0,0.34)" }}
        >
          {item(<UserCircle2 size={16} />, "Account · sign in / up", () => setAccountOpen(true))}
          {item(<Archive size={16} />, "Archive", () => setArchiveOpen(true))}
          {item(<Cloud size={16} />, "Cloud storage", () => setCloudDialogOpen(true), connectedClouds.length || "")}
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Inner avatar + name + subtitle used by both the seed and Clerk variants. */
function IdentityInner({ color, initial, name, sub, img }: { color: string; initial: string; name: string; sub: string; img?: string }) {
  return (
    <>
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: color, color: "#16161a", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
      </span>
      <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, textAlign: "left" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>
      </span>
    </>
  );
}

/** The real signed-in Clerk identity (name + a short user id). */
function ClerkIdentity({ color }: { color: string }) {
  const { isSignedIn, user } = useUser();
  if (!isSignedIn || !user) {
    return <IdentityInner color={color} initial="?" name="Account" sub="Sign in" />;
  }
  const name =
    user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Account";
  const shortId = user.id.replace(/^user_/, "").slice(0, 10);
  return <IdentityInner color={color} initial={name.charAt(0).toUpperCase()} name={name} sub={`ID · ${shortId}`} img={user.imageUrl} />;
}
