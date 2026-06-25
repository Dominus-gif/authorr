import Link from "next/link";
import type { Metadata } from "next";
import {
  Feather,
  Sparkles,
  Maximize2,
  History,
  Lock,
  Type,
  FileDown,
  Wand2,
  Star,
  ArrowRight,
  PenLine,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { PricingPlans } from "@/components/marketing/PricingPlans";

export const metadata: Metadata = {
  title: "Authorr — write better, faster, without the noise",
  description:
    "Authorr is a distraction-free writing app with a built-in AI editing suite, full version history, and one-click export. Start free, go Personal for $5/month.",
};

const MAX = 1152;

/* ───────── primitives (match the Authorr design system) ───────── */
function Logo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--accent)", color: "#fff" }}>
        <Feather size={17} />
      </span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink-900)" }}>Authorr</span>
    </span>
  );
}

type BtnSize = "sm" | "md" | "lg";
type BtnVariant = "primary" | "secondary" | "ghost";
const BTN_SIZE: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: "0 14px", height: 36, fontSize: 13.5, gap: 7 },
  md: { padding: "0 18px", height: 44, fontSize: 15, gap: 8 },
  lg: { padding: "0 24px", height: 52, fontSize: 16.5, gap: 9 },
};
const BTN_VARIANT: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-accent)" },
  secondary: { background: "var(--surface-card)", color: "var(--text-heading)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-xs)" },
  ghost: { background: "transparent", color: "var(--text-strong)" },
};
function Btn({
  children, href = "/app", variant = "primary", size = "md", pill = false, iconRight, style,
}: { children: React.ReactNode; href?: string; variant?: BtnVariant; size?: BtnSize; pill?: boolean; iconRight?: React.ReactNode; style?: React.CSSProperties }) {
  const s = BTN_SIZE[size];
  return (
    <Link
      href={href}
      className={`ds-btn ds-btn-${variant}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: s.gap,
        height: s.height, padding: s.padding, fontFamily: "var(--font-ui)", fontSize: s.fontSize,
        fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1, border: "1px solid transparent",
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-md)", whiteSpace: "nowrap", cursor: "pointer",
        ...BTN_VARIANT[variant], ...style,
      }}
    >
      {children}
      {iconRight}
    </Link>
  );
}

function FeatureIcon({ icon: Icon, accent }: { icon: LucideIcon; accent?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "var(--radius-md)", background: accent ? "var(--accent)" : "var(--paper-50)", border: accent ? "none" : "1px solid var(--border)", color: accent ? "#fff" : "var(--accent)", boxShadow: accent ? "var(--shadow-accent)" : "none" }}>
      <Icon size={20} />
    </span>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div style={{ height: 7, borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", borderRadius: "var(--radius-pill)", background: "var(--accent)" }} />
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub: string }) {
  return (
    <Reveal y={16} style={{ margin: "0 auto", maxWidth: 560, textAlign: "center" }}>
      {eyebrow && <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>{eyebrow}</div>}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink-900)", margin: 0, lineHeight: 1.1 }}>{title}</h2>
      <p style={{ fontFamily: "var(--font-body)", marginTop: 14, fontSize: 17, lineHeight: 1.65, color: "var(--text-body)" }}>{sub}</p>
    </Reveal>
  );
}

const cardBase: React.CSSProperties = { borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" };
const title3 = (light?: boolean): React.CSSProperties => ({ fontFamily: "var(--font-display)", marginTop: 20, marginBottom: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: light ? "#fff" : "var(--ink-900)" });
const body = (light?: boolean): React.CSSProperties => ({ fontFamily: "var(--font-body)", marginTop: 8, marginBottom: 0, fontSize: 14.5, lineHeight: 1.7, color: light ? "rgba(243,239,237,0.78)" : "var(--text-body)" });

const MARQUEE = ["Essays", "Novels", "Newsletters", "Screenplays", "Research papers", "Blog posts", "Poetry", "Scripts", "Memoirs", "Documentation"];
const SMALL: [LucideIcon, string, string][] = [
  [Maximize2, "Zen canvas", "A borderless, full-screen editor. The UI fades while you type and returns on a glance."],
  [History, "Version history", "Every save is snapshotted. Compare any two versions with a clean visual diff and restore in a click."],
  [Type, "Typography", "Ten self-hosted fonts, four themes, and per-selection font & size control."],
  [Lock, "Built-in security", "Per-note passcodes with auto-lock and signed .ef files with integrity keys."],
];
const STEPS: [string, LucideIcon, string, string][] = [
  ["01", PenLine, "Open & write", "Launch the canvas and start typing immediately. Markdown shortcuts and a slash menu keep your hands on the keyboard."],
  ["02", Wand2, "Refine with AI", "Watch tone and clarity update live, fix grammar inline, and rewrite weak passages with one click."],
  ["03", FileDown, "Share or export", "Send a clean share link or export to PDF, Word or Markdown — formatting intact."],
];
const TESTIMONIALS: [string, string, string, string][] = [
  ["The AI panel catches my passive voice before I even notice it. My drafts are tighter on the first pass.", "Maya R.", "Essayist", "#c8402f"],
  ["Version history saved a chapter I thought I'd lost. The diff view made it obvious what changed.", "Daniel K.", "Novelist", "#1f8a5b"],
  ["I draft my whole newsletter in zen mode, then export straight to Markdown. It just gets out of the way.", "Inés V.", "Newsletter writer", "#3a6ea5"],
];
const FAQ: [string, string][] = [
  ["Do I need an account to try Authorr?", "No. Open the app and start writing instantly — the Free plan needs no sign-up, and your work is kept under your profile on your device."],
  ["What's included in the $5 Personal plan?", "Everything Authorr does for a solo writer: the full AI editing suite, unlimited version history, every font and theme, passcodes, signed .ef files, sharing links, and all export formats. The only thing it leaves out is the team collaboration workspace."],
  ["When would I need Workspace?", "Workspace is for teams. It adds real-time multi-user editing, roles and permissions, shared team spaces, and admin controls. Solo writers never need it."],
  ["Can I move my work in and out?", "Always. Import a .ef file to open it instantly, and export any document to PDF, Word, Markdown or plain text whenever you like. Your words are never locked in."],
  ["Is my writing private?", "Yes. Notes stay local by default, can be passcode-protected with auto-lock, and export to a signed .ef format with an integrity key."],
];

function Mockup() {
  const rows: [string, string][] = [["Tone", "Reflective · 78%"], ["Clarity", "1 long sentence"], ["Grammar", "All clear"]];
  return (
    <div style={{ overflow: "hidden", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--surface-card)", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ height: 42, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
        <span style={{ display: "flex", gap: 6 }} aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--paper-200)" }} />)}
        </span>
        <span style={{ marginLeft: 8, fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>On finishing things</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--status-published)", fontFamily: "var(--font-ui)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-published)" }} /> Saved
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px" }}>
        <div style={{ padding: 32 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--ink-900)", letterSpacing: "-0.02em" }}>On finishing things</div>
          <p style={{ fontFamily: "var(--font-body)", marginTop: 16, marginBottom: 0, fontSize: 15.5, lineHeight: 1.75, color: "var(--text-body)" }}>
            The hardest part of any draft is not the first sentence but the{" "}
            <span style={{ borderRadius: 4, padding: "0 4px", background: "var(--selection)", color: "var(--accent-hover)" }}>second</span>. The cursor blinks, patient, and the room goes quiet.
          </p>
          <p style={{ fontFamily: "var(--font-body)", marginTop: 12, marginBottom: 0, fontSize: 15.5, lineHeight: 1.75, color: "var(--text-muted)" }}>
            Everything else fades — until you reach for the edge.<span style={{ display: "inline-block", width: 2, height: 17, marginLeft: 2, transform: "translateY(3px)", background: "var(--accent)" }} />
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            <span>318 words</span><span>·</span><span>2 min read</span>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)", background: "var(--paper-50)", padding: 14 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-ui)" }}>
            <Sparkles size={13} /> AI suite
          </div>
          {rows.map(([l, v]) => (
            <div key={l} style={{ marginBottom: 8, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-card)", padding: "8px 12px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-ui)" }}>{l}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>{v}</div>
            </div>
          ))}
          <div style={{ marginTop: 4 }}><Btn variant="primary" size="sm" style={{ width: "100%" }}>Rewrite</Btn></div>
        </div>
      </div>
    </div>
  );
}

/** Hand-drawn marker arrows for the studio-sketchbook layer. */
function DoodleArrow({ kind, width = 86, height = 54 }: { kind: "curveR" | "curveL" | "down" | "underline"; width?: number; height?: number }) {
  const paths: Record<string, string> = {
    // gentle right-sweeping arrow with a two-stroke head
    curveR: "M4 12 C 30 6, 58 14, 76 40 M76 40 L62 34 M76 40 L70 24",
    curveL: "M82 12 C 56 6, 28 14, 10 40 M10 40 L24 34 M10 40 L16 24",
    down: "M16 4 C 10 22, 26 30, 18 50 M18 50 L9 40 M18 50 L28 41",
    underline: "M4 10 C 28 26, 64 26, 88 8",
  };
  return (
    <svg width={width} height={height} viewBox="0 0 88 54" fill="none">
      <path className="ds-doodle-stroke" d={paths[kind]} />
    </svg>
  );
}

/** A positioned marker annotation: handwritten note + optional pointing arrow. */
function Doodle({ children, arrow, rot = -4, style }: { children?: React.ReactNode; arrow?: React.ReactNode; rot?: number; style: React.CSSProperties }) {
  return (
    <div aria-hidden className="ds-doodle" style={{ "--doodle-rot": `rotate(${rot}deg)`, fontSize: 23, fontWeight: 600, lineHeight: 1.15, ...style } as React.CSSProperties}>
      {children}
      {arrow}
    </div>
  );
}

export default function Home() {
  return (
    <div className="authorr-ds grid-bg" style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <header style={{ position: "sticky", top: 12, zIndex: 30, padding: "0 20px" }}>
        <nav style={{ margin: "0 auto", maxWidth: MAX, height: 60, display: "flex", alignItems: "center", gap: 24, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", padding: "0 18px", boxShadow: "var(--shadow-xs)" }}>
          <Logo />
          <div className="nav-links" style={{ marginLeft: 14, display: "flex", gap: 26, fontSize: 14.5, fontWeight: 500, color: "var(--text-body)" }}>
            <a href="#features" className="navlink">Features</a>
            <a href="#how" className="navlink">How it works</a>
            <a href="#pricing" className="navlink">Pricing</a>
            <a href="#faq" className="navlink">FAQ</a>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/app" className="navlink" style={{ fontSize: 14.5, fontWeight: 500 }}>Open app</Link>
            <Btn variant="primary" size="sm" pill iconRight={<ArrowRight size={16} />}>Start writing</Btn>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero-wash" style={{ position: "relative", margin: "0 auto", maxWidth: MAX, padding: "56px 20px 48px" }}>
        {/* Studio-sketchbook annotations */}
        <Doodle rot={-7} style={{ top: 84, left: 18, textAlign: "center" }}>
          no clutter,<br />just your words
          <span style={{ display: "block", marginTop: -2, marginLeft: 46 }}><DoodleArrow kind="curveR" /></span>
        </Doodle>
        <Doodle rot={6} style={{ top: 150, right: 20, textAlign: "center" }}>
          the AI reads<br />as you type
          <span style={{ display: "block", marginTop: -4, marginRight: 40 }}><DoodleArrow kind="curveL" /></span>
        </Doodle>
        <Doodle rot={-3} style={{ bottom: 40, left: "50%", transform: "translateX(-50%)", "--doodle-rot": "rotate(-3deg)", fontSize: 20 } as React.CSSProperties}>
          ↑ this is the whole interface
        </Doodle>
        <div style={{ margin: "0 auto", maxWidth: 760, textAlign: "center" }}>
          <Reveal tag="span" immediate y={14} style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: "var(--radius-pill)", border: "1px solid var(--border)", background: "var(--surface-card)", padding: "6px 14px", fontSize: 12.5, fontWeight: 500, color: "var(--text-body)" }}>
            <Sparkles size={13} color="var(--accent)" /> AI editing · version history · zero distractions
          </Reveal>
          <Reveal tag="h1" immediate delay={0.08} style={{ fontFamily: "var(--font-display)", margin: "24px 0 0", fontSize: 62, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.03em", color: "var(--ink-900)", textWrap: "balance" }}>
            Write better, faster,<br />
            <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
              <span aria-hidden style={{ position: "absolute", left: "-0.16em", right: "-0.16em", top: "0.1em", bottom: "0.12em", background: "var(--marker)", borderRadius: "62% 38% 56% 44% / 56% 52% 48% 44%", transform: "rotate(-1.4deg)", zIndex: 0 }} />
              <span style={{ position: "relative", zIndex: 1, color: "var(--ink-900)" }}>without the noise.</span>
            </span>
          </Reveal>
          <Reveal tag="p" immediate delay={0.16} style={{ fontFamily: "var(--font-body)", margin: "24px auto 0", maxWidth: 540, fontSize: 18, lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" }}>
            Authorr is a calm, full-screen writing app with a built-in AI editor, complete version history and one-click export — so the only thing left to do is write.
          </Reveal>
          <Reveal immediate delay={0.24} style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" pill iconRight={<ArrowRight size={18} />}>Start writing — free</Btn>
            <Btn href="#pricing" variant="secondary" size="lg" pill>See pricing</Btn>
          </Reveal>
          <Reveal immediate delay={0.32} y={12} style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
            <span style={{ display: "inline-flex" }} aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={15} style={{ fill: "#e8a33d", color: "#e8a33d" }} />)}
            </span>
            Loved by focused writers and small teams
          </Reveal>
        </div>
        <Reveal immediate delay={0.2} y={24} style={{ margin: "56px auto 0", maxWidth: 880 }}><Mockup /></Reveal>
      </section>

      {/* Marquee */}
      <section aria-label="What people write with Authorr" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--paper-50)", padding: "24px 0", overflow: "hidden" }}>
        <div className="ds-marquee" style={{ display: "flex", width: "max-content", gap: 12 }}>
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} style={{ borderRadius: "var(--radius-pill)", border: "1px solid var(--border)", background: "var(--surface-card)", padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-ui)", whiteSpace: "nowrap" }}>{m}</span>
          ))}
        </div>
      </section>

      {/* Bento features */}
      <section id="features" style={{ margin: "0 auto", maxWidth: MAX, padding: "104px 20px" }}>
        <SectionHead title="Everything you need to write well" sub="A focused canvas on the outside, a serious editing system underneath." />
        <div style={{ marginTop: 48, display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
          <Reveal style={{ ...cardBase, gridColumn: "span 2", background: "var(--paper-50)", padding: 36, display: "flex", flexDirection: "column" }}>
            <FeatureIcon icon={Wand2} accent />
            <h3 style={title3()}>An editor that reads along with you</h3>
            <p style={body()}>Live tone, clarity and grammar analysis flag passive voice, repetition and long sentences as you type. Select any passage to rewrite, shorten or simplify it.</p>
            <div style={{ marginTop: "auto", paddingTop: 22, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              {([["Tone", "Reflective", 78], ["Clarity", "Clear", 64]] as [string, string, number][]).map(([l, v, pct]) => (
                <div key={l} style={{ ...cardBase, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-ui)" }}><Gauge size={15} color="var(--accent)" /> {l}</span>
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>{v}</span>
                  </div>
                  <div style={{ marginTop: 12 }}><Meter value={pct} /></div>
                </div>
              ))}
            </div>
          </Reveal>

          {SMALL.map(([Ic, t, b], i) => (
            <Reveal key={t} className="ds-card-interactive" delay={(i + 1) * 0.075} style={{ ...cardBase, padding: 32 }}>
              <FeatureIcon icon={Ic} />
              <h3 style={title3()}>{t}</h3>
              <p style={body()}>{b}</p>
            </Reveal>
          ))}

          <Reveal style={{ ...cardBase, gridColumn: "span 3", padding: 40, background: "var(--paper-50)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 600 }}>
              <FeatureIcon icon={FileDown} accent />
              <h3 style={title3()}>Export anywhere, lose nothing</h3>
              <p style={body()}>Print-ready PDF, editable Word, Markdown and plain text — with your tables, highlights and signatures preserved exactly as you wrote them.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 380 }}>
              {["PDF", "Word", "Markdown", "Text", ".ef"].map((f) => (
                <span key={f} style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", border: "1px solid var(--border)", background: "var(--surface-card)", padding: "9px 18px", fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-ui)", boxShadow: "var(--shadow-xs)" }}>{f}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--glow-bg), var(--paper-50)" }}>
        <div style={{ margin: "0 auto", maxWidth: MAX, padding: "104px 20px" }}>
          <SectionHead eyebrow="How it works" title="From blank page to published" sub="Three steps. No setup, no learning curve." />
          <div style={{ marginTop: 48, display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
            {STEPS.map(([n, Ic, t, d], i) => (
              <Reveal key={n} y={22} delay={i * 0.1} style={{ ...cardBase, padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <FeatureIcon icon={Ic} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--paper-200)" }}>{n}</span>
                </div>
                <h3 style={title3()}>{t}</h3>
                <p style={body()}>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ margin: "0 auto", maxWidth: MAX, padding: "104px 20px" }}>
        <SectionHead title="Writers in flow" sub="A few words from the kinds of people Authorr is built for." />
        <div style={{ marginTop: 48, display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
          {TESTIMONIALS.map(([q, n, r, c], i) => (
            <Reveal key={n} tag="figure" y={22} delay={i * 0.1} style={{ ...cardBase, margin: 0, padding: 32, display: "flex", flexDirection: "column" }}>
              <span style={{ display: "inline-flex" }} aria-hidden>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} style={{ fill: "#e8a33d", color: "#e8a33d" }} />)}</span>
              <blockquote style={{ fontFamily: "var(--font-body)", margin: "16px 0 0", flex: 1, fontSize: 15.5, lineHeight: 1.7, color: "var(--text-strong)" }}>“{q}”</blockquote>
              <figcaption style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: c, color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-ui)" }}>{n.charAt(0)}</span>
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink-900)", fontFamily: "var(--font-ui)" }}>{n}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>{r}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--paper-50)" }}>
        <div style={{ margin: "0 auto", maxWidth: MAX, padding: "104px 20px" }}>
          <SectionHead title="Simple pricing, no surprises" sub="Start free. Unlock everything from $5/month — switch to yearly and save 20%." />
          <PricingPlans />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ margin: "0 auto", maxWidth: 760, padding: "104px 20px" }}>
        <Reveal tag="h2" style={{ fontFamily: "var(--font-display)", textAlign: "center", fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink-900)", margin: 0 }}>Questions, answered</Reveal>
        <Reveal delay={0.08} style={{ marginTop: 40, borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--surface-card)", overflow: "hidden" }}>
          {FAQ.map(([q, a], i) => (
            <details key={q} className="faq" style={{ borderTop: i ? "1px solid var(--border)" : "none", padding: "0 24px" }}>
              <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer", listStyle: "none", padding: "20px 0", fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>
                {q}<ArrowRight size={16} className="faq-chev" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </summary>
              <p style={{ fontFamily: "var(--font-body)", paddingBottom: 20, margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "var(--text-body)" }}>{a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* Final CTA */}
      <section style={{ position: "relative", margin: "0 auto", maxWidth: MAX, padding: "0 20px 104px" }}>
        <Doodle rot={8} style={{ top: -34, right: 40, textAlign: "center", color: "var(--doodle)" }}>
          go on, it&apos;s free
          <span style={{ display: "block", marginTop: -2, marginLeft: 30 }}><DoodleArrow kind="down" /></span>
        </Doodle>
        <Reveal y={24} style={{ position: "relative", overflow: "hidden", borderRadius: 32, background: "var(--surface-inverse)", padding: "80px 40px", textAlign: "center" }}>
          <div aria-hidden style={{ position: "absolute", inset: "0 0 auto 0", height: 200, opacity: 0.5, filter: "blur(80px)", background: "radial-gradient(closest-side, var(--accent), transparent)" }} />
          <h2 style={{ position: "relative", fontFamily: "var(--font-display)", fontSize: 50, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: 0, lineHeight: 1.05 }}>Your next draft is waiting</h2>
          <p style={{ position: "relative", fontFamily: "var(--font-body)", margin: "16px auto 0", maxWidth: 440, fontSize: 16.5, lineHeight: 1.6, color: "rgba(243,239,237,0.8)" }}>Open the canvas and write the first line. Authorr takes care of the rest.</p>
          <div style={{ position: "relative", marginTop: 32, display: "flex", justifyContent: "center", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" pill iconRight={<ArrowRight size={16} />}>Start writing — free</Btn>
            <Link href="/app" style={{ fontFamily: "var(--font-ui)", fontSize: 14.5, fontWeight: 500, color: "rgba(243,239,237,0.8)" }}>or open the app →</Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ margin: "0 auto", maxWidth: MAX, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "32px 20px", flexWrap: "wrap" }}>
          <Logo />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>A distraction-free writing app for creators.</p>
          <div style={{ display: "flex", gap: 20, fontSize: 12.5, fontFamily: "var(--font-ui)" }}>
            <a href="#features" className="navlink">Features</a>
            <a href="#pricing" className="navlink">Pricing</a>
            <Link href="/app" className="navlink">Open app</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

