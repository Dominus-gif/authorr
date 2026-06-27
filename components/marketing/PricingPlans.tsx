"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Users, Check, KeyRound } from "lucide-react";
import { Reveal } from "./Reveal";

/** Authorr marketing pricing — billing toggle (Framer Motion spring indicator)
 *  + three plan cards. Mirrors the handoff `Pricing.jsx`. */

const TOGGLE_W = 116;

function BillingToggle({ yearly, setYearly }: { yearly: boolean; setYearly: (v: boolean) => void }) {
  const reduce = useReducedMotion();
  const left = yearly ? 4 + TOGGLE_W : 4;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 8 }}>
      <div style={{ position: "relative", display: "inline-flex", padding: 4, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-card)", boxShadow: "var(--shadow-xs)" }}>
        {reduce ? (
          <div aria-hidden style={{ position: "absolute", top: 4, bottom: 4, width: TOGGLE_W, borderRadius: 999, background: "var(--accent)", left }} />
        ) : (
          <motion.div
            aria-hidden
            initial={false}
            animate={{ left }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            style={{ position: "absolute", top: 4, bottom: 4, width: TOGGLE_W, borderRadius: 999, background: "var(--accent)", willChange: "left" }}
          />
        )}
        {(["Monthly", "Yearly"] as const).map((lbl, i) => {
          const active = (i === 1) === yearly;
          return (
            <button
              key={lbl}
              onClick={() => setYearly(i === 1)}
              style={{ position: "relative", zIndex: 1, width: TOGGLE_W, border: "none", background: "transparent", cursor: "pointer", padding: "8px 0", borderRadius: 999, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: active ? "#fff" : "var(--text-body)", transition: "color var(--dur-base) var(--ease-out)" }}
            >
              {lbl}
            </button>
          );
        })}
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-doodle)", fontSize: 19, fontWeight: 600, color: "var(--accent)", transform: "rotate(-4deg)" }} aria-hidden>
        <svg viewBox="0 0 110 90" width={30} height={24} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1) rotate(8deg)" }}>
          <path d="M104 10 C 64 2 24 14 14 70" /><path d="M14 70 L 26 50 M14 70 L 37 66" />
        </svg>
        save 20%
      </span>
    </div>
  );
}

interface Plan {
  name: string; priceM: number; period: string; tagline: string; cta: string;
  features: string[]; featured?: boolean; team?: boolean; byok?: boolean; note?: string;
}

const PLANS: Plan[] = [
  { name: "Free", priceM: 0, period: "forever", tagline: "For trying it out", cta: "Start free",
    features: ["Zen full-screen editor", "Live word & reading stats", "Markdown + slash commands", "Default font & theme", "Export to Text & Markdown"] },
  { name: "Personal", priceM: 5, period: "/month", tagline: "Everything for solo writers", cta: "Start writing", featured: true, byok: true, note: "All features — except the team workspace.",
    features: ["Full AI editing suite (tone, clarity, grammar, rewrite)", "Unlimited version history & visual diffs", "All 10 fonts & 4 themes", "Passcodes, auto-lock & signed .ef files", "Tables, images, embeds & signatures", "Share links + every export (PDF, Word, MD, TXT)"] },
  { name: "Workspace", priceM: 12, period: "/user · mo", tagline: "For teams & organizations", cta: "Start a workspace", team: true,
    features: ["Everything in Personal", "Real-time multi-user editing", "Roles, permissions & access control", "Shared team workspaces", "Edit-request & review workflows", "Admin & member management"] },
];

const fmt = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

function PlanCard({ plan, yearly, delay }: { plan: Plan; yearly: boolean; delay: number }) {
  const { name, priceM, period, tagline, cta, features, featured, team, byok, note } = plan;
  const free = priceM === 0;
  const price = free ? "$0" : fmt(yearly ? priceM * 0.8 : priceM);
  const strike = !free && yearly ? fmt(priceM) : null;
  const billedNote = !free && yearly ? (team ? "billed yearly per user" : `billed yearly — $${Math.round(priceM * 0.8 * 12)}/yr`) : "";

  return (
    <Reveal y={22} delay={delay} style={{ display: "flex" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, borderRadius: "var(--radius-xl)", background: "var(--surface-card)", padding: 28, border: featured ? "2px solid var(--accent)" : "1px solid var(--border)", boxShadow: featured ? "var(--shadow-accent)" : "var(--shadow-xs)" }}>
        {featured && (
          <span style={{ position: "absolute", top: -13, left: 28, display: "inline-flex", alignItems: "center", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 9px", borderRadius: "var(--radius-pill)", lineHeight: 1, background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>Most popular</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>{name}</h3>
          {team && <Users size={15} color="var(--text-muted)" />}
        </div>
        <p style={{ fontFamily: "var(--font-body)", marginTop: 4, marginBottom: 0, fontSize: 14, color: "var(--text-muted)" }}>{tagline}</p>
        <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 7 }}>
          {strike && <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--text-faint)", textDecoration: "line-through" }}>{strike}</span>}
          <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink-900)" }}>{price}</span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--text-muted)" }}>{period}</span>
        </div>
        <div style={{ minHeight: 16, marginTop: 4, fontFamily: "var(--font-ui)", fontSize: 12.5, color: "var(--accent)", fontWeight: 600 }}>{billedNote}</div>
        <div style={{ marginTop: 16 }}>
          <a href="/app" style={{ display: "inline-flex", width: "100%", alignItems: "center", justifyContent: "center", padding: "11px 0", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-ui)", fontSize: 14.5, fontWeight: 600, ...(featured ? { background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-accent)" } : { background: "var(--surface-card)", color: "var(--ink-900)", border: "1px solid var(--border-strong)" }) }}>{cta}</a>
        </div>
        {note && <p style={{ marginTop: 12, marginBottom: 0, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-ui)" }}>{note}</p>}
        {byok && (
          <div style={{ marginTop: 18, display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--accent-wash)", border: "1px solid var(--accent-soft)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 9, background: "var(--accent)", flexShrink: 0 }}><KeyRound size={15} color="#fff" /></span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Bring your own key</span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--accent)", background: "var(--surface-card)", border: "1px solid var(--accent-soft)", borderRadius: 999, padding: "1px 7px" }}>BYOK</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-body)" }}>Plug in your own AI provider keys and run the editing suite on your own account.</p>
            </div>
          </div>
        )}
        <ul style={{ listStyle: "none", margin: "20px 0 0", padding: "20px 0 0", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
          {features.map((f) => (
            <li key={f} style={{ display: "flex", gap: 12, fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--text-strong)" }}>
              <Check size={16} color="var(--accent)" style={{ marginTop: 3, flexShrink: 0 }} /> {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);
  return (
    <>
      <BillingToggle yearly={yearly} setYearly={setYearly} />
      <div style={{ margin: "40px auto 0", maxWidth: 980, display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", alignItems: "stretch" }}>
        {PLANS.map((p, i) => (
          <PlanCard key={p.name} plan={p} yearly={yearly} delay={i * 0.08} />
        ))}
      </div>
    </>
  );
}
