import Link from "next/link";

/** Authorr sign-up / sign-in shell — a faithful build of the "Sign Up.dc.html"
 *  handoff: two columns inside a centered 1320px frame, the brand pitch + studio
 *  doodles on the left, the Clerk widget styled into the brand card on the right.
 *  The Clerk form is restyled via the global `.cl-*` block below so its social
 *  buttons (48px), inputs (48px) and Continue button (50px, trailing arrow) match
 *  the mockup pixel-for-pixel. */
export function AuthShell({
  heading,
  sub,
  footerText,
  footerLink,
  footerHref,
  children,
}: {
  heading: string;
  sub: string;
  footerText: string;
  footerLink: string;
  footerHref: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="authorr-ds"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        background: "var(--paper-50)",
        color: "var(--ink-900)",
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* Restyle the Clerk widget to the handoff spec. Clerk's internal CSS sets
          its own heights / padding / margins, so these win with !important. */}
      <style>{`
        /* Kill Clerk's entrance animations — they can leave elements (notably the
           submit button) stuck mid-transform until a click forces a repaint,
           which made the button render oversized/misaligned at rest. The spinner
           keeps its own animation so the loading state still spins. */
        .cl-rootBox *:not(.cl-spinner):not([class*="spinner"]):not([class*="Spinner"]) { animation: none !important; }
        .cl-rootBox, .cl-cardBox, .cl-card { width:100% !important; max-width:100% !important; background:transparent !important; box-shadow:none !important; border:0 !important; padding:0 !important; margin:0 !important; }
        .cl-main { gap:22px !important; padding:0 !important; margin:0 !important; width:100% !important; }
        .cl-logoBox, .cl-footer, .cl-footerAction { display:none !important; }
        /* Header (card title + subtitle) */
        .cl-header { display:flex !important; flex-direction:column !important; align-items:center !important; gap:5px !important; margin:0 0 4px !important; padding:0 !important; }
        .cl-headerTitle { font-family:var(--font-display) !important; font-size:19px !important; font-weight:600 !important; letter-spacing:-0.01em !important; color:var(--ink-900) !important; }
        .cl-headerSubtitle { font-family:var(--font-body) !important; font-size:14px !important; color:var(--ink-400) !important; line-height:1.5 !important; }
        /* Social row — icon only, 48px */
        .cl-socialButtons { display:flex !important; gap:12px !important; width:100% !important; margin:0 !important; padding:0 !important; }
        .cl-socialButtonsBlockButton, .cl-socialButtonsIconButton { flex:1 1 0 !important; min-width:0 !important; height:48px !important; min-height:48px !important; padding:0 !important; margin:0 !important; border-radius:12px !important; border:1px solid var(--line-200) !important; background:#fff !important; box-shadow:none !important; transition:border-color 140ms, background 140ms !important; }
        .cl-socialButtonsBlockButton:hover, .cl-socialButtonsIconButton:hover { background:var(--paper-100) !important; }
        .cl-socialButtonsBlockButtonText, .cl-socialButtonsBlockButtonArrow { display:none !important; }
        .cl-socialButtonsProviderIcon, .cl-socialButtonsBlockButton img, .cl-socialButtonsIconButton img { width:20px !important; height:20px !important; }
        /* or divider */
        .cl-dividerRow { display:flex !important; align-items:center !important; gap:12px !important; margin:0 !important; padding:0 !important; width:100% !important; }
        .cl-dividerLine { flex:1 !important; height:1px !important; background:var(--line-100) !important; }
        .cl-dividerText { font-family:var(--font-ui) !important; color:var(--ink-300) !important; font-size:12px !important; font-weight:500 !important; }
        /* Fields */
        .cl-form { display:flex !important; flex-direction:column !important; gap:16px !important; width:100% !important; margin:0 !important; padding:0 !important; }
        .cl-formFieldRow, .cl-formField { width:100% !important; margin:0 !important; padding:0 !important; }
        .cl-formFieldLabel { font-family:var(--font-ui) !important; font-size:13px !important; font-weight:600 !important; color:var(--ink-700) !important; letter-spacing:0.01em !important; margin-bottom:5px !important; }
        .cl-formFieldInput { height:48px !important; min-height:48px !important; padding:0 16px !important; border:1px solid var(--line-200) !important; border-radius:11px !important; font-family:var(--font-body) !important; font-size:15px !important; background:#fff !important; color:var(--ink-700) !important; box-shadow:none !important; }
        .cl-formFieldInput::placeholder { color:var(--ink-300) !important; }
        .cl-formFieldInput:focus, .cl-formFieldInput:focus-within { border-color:#3A6B3A !important; box-shadow:0 0 0 3px rgba(58,107,58,0.15) !important; outline:none !important; }
        .cl-formFieldInputGroup, .cl-otpCodeFieldInputs { gap:8px !important; }
        /* Continue button — 50px, trailing arrow */
        .cl-formButtonPrimary { box-sizing:border-box !important; width:100% !important; max-width:100% !important; height:44px !important; min-height:44px !important; max-height:44px !important; padding:0 18px !important; margin:8px 0 0 !important; border-radius:10px !important; background:#3A6B3A !important; color:#fff !important; font-family:var(--font-ui) !important; font-size:14px !important; font-weight:600 !important; line-height:1 !important; letter-spacing:0 !important; box-shadow:none !important; text-transform:none !important; border:0 !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:6px !important; transform:none !important; transition:background 140ms !important; }
        .cl-formButtonPrimary:hover { background:#2d5630 !important; transform:none !important; }
        .cl-formButtonPrimary:active { transform:none !important; }
        /* Remove Clerk's built-in trailing arrow / chevron so the label sits clean and centred (keep the loading spinner) */
        .cl-formButtonPrimary .cl-buttonArrowIcon, .cl-formButtonPrimary svg.cl-buttonArrowIcon { display:none !important; }
        .cl-formButtonPrimary::after, .cl-formButtonPrimary::before { content:none !important; display:none !important; }
        .cl-formResendCodeLink, .cl-formFieldAction, .cl-identityPreviewEditButton { color:#3A6B3A !important; }
      `}</style>

      {/* Full-page technical grid */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, var(--line-100) 1px, transparent 1px), linear-gradient(to bottom, var(--line-100) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Ambient glows */}
      <div aria-hidden style={glow("top:-80px;left:-80px;width:620px;height:540px", "radial-gradient(ellipse at 30% 30%, rgba(253,247,244,0.95) 0%, rgba(247,239,242,0.6) 45%, transparent 70%)")} />
      <div aria-hidden style={glow("top:-40px;left:38%;width:480px;height:360px", "radial-gradient(ellipse at 50% 20%, rgba(255,242,200,0.55) 0%, rgba(253,247,244,0.3) 50%, transparent 70%)")} />
      <div aria-hidden style={glow("bottom:-100px;right:-60px;width:500px;height:480px", "radial-gradient(ellipse at 70% 70%, rgba(230,244,236,0.5) 0%, rgba(253,247,244,0.3) 50%, transparent 70%)")} />

      {/* Layout — centered 1320px frame, two columns + a hairline divider */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%", maxWidth: 1320, minHeight: "100vh", margin: "0 auto", gap: 56 }}>

        {/* ── LEFT BRAND COLUMN ── */}
        <aside
          className="auth-brand-col"
          style={{
            flex: "1.05 1 0",
            display: "none",
            flexDirection: "column",
            padding: "36px 0 36px 56px",
            position: "relative",
          }}
        >
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <span style={{ width: 36, height: 36, background: "#3A6B3A", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <FeatherIcon size={18} color="#fff" />
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-0.01em" }}>
              Authorr
            </span>
          </Link>

          {/* Centered content with the studio-doodle layer over it */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 0 40px", position: "relative" }}>

            {/* Doodle layer */}
            <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              {/* Sparkle top-right */}
              <svg style={{ position: "absolute", top: -30, right: 80 }} width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2 L15.2 12.8 L26 14 L15.2 15.2 L14 26 L12.8 15.2 L2 14 L12.8 12.8 Z" fill="#3A6B3A" opacity="0.5" />
              </svg>
              {/* Small sparkle */}
              <svg style={{ position: "absolute", top: 10, right: 160 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1 L8.8 7.2 L15 8 L8.8 8.8 L8 15 L7.2 8.8 L1 8 L7.2 7.2 Z" fill="#3A6B3A" opacity="0.35" />
              </svg>
              {/* Curved arrow into the headline */}
              <svg style={{ position: "absolute", top: 80, left: -30 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M50 10 Q10 10 10 45" stroke="#3A6B3A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
                <path d="M6 40 L10 48 L16 43" stroke="#3A6B3A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
              {/* Squiggle under eyebrow */}
              <svg style={{ position: "absolute", top: 52, left: 0 }} width="80" height="12" viewBox="0 0 80 12" fill="none">
                <path d="M2 8 Q12 2 22 8 Q32 14 42 8 Q52 2 62 8 Q72 14 78 8" stroke="#3A6B3A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
              </svg>
              {/* Handwritten notes */}
              <div style={{ ...doodleNote, bottom: 130, right: 60, transform: "rotate(-3deg)", opacity: 0.75 }}>
                updates live, as you type →
              </div>
              <div style={{ ...doodleNote, bottom: 90, right: 30, transform: "rotate(2deg)", opacity: 0.65 }}>
                ✦ no credit card needed
              </div>
            </div>

            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B3A", marginBottom: 20 }}>
              Free forever · No credit card
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "4.1rem", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.035em", color: "var(--ink-900)", margin: "0 0 22px" }}>
              Write better, faster,<br />
              <span style={{ position: "relative", display: "inline", whiteSpace: "nowrap" }}>
                <span
                  aria-hidden
                  style={{ position: "absolute", bottom: 2, left: -4, right: -4, height: "60%", background: "rgba(255, 222, 120, 0.45)", borderRadius: 3, zIndex: -1, transform: "rotate(-0.5deg)" }}
                />
                without the noise.
              </span>
            </h1>

            <p style={{ fontFamily: "var(--font-body)", fontSize: 19, lineHeight: 1.6, color: "var(--ink-500)", maxWidth: 460, margin: "0 0 44px" }}>
              Your calm, full-screen writing studio with a built-in AI editor, full version history and one-click export.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {FEATURES.map(({ label, icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 11, background: "#e8f2e8", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#3A6B3A" }}>
                    {icon}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--ink-700)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--ink-400)", margin: 0 }}>
            © {new Date().getFullYear()} Authorr ·{" "}
            <Link href="/" style={{ color: "var(--ink-400)", textDecoration: "none" }}>
              A distraction-free writing app for creators.
            </Link>
          </p>
        </aside>

        {/* ── DIVIDER ── */}
        <div className="auth-divider" aria-hidden style={{ display: "none", width: 1, background: "var(--line-100)", alignSelf: "stretch", flexShrink: 0 }} />

        {/* ── RIGHT FORM COLUMN ── */}
        <main
          style={{
            flex: "0.95 1 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 56px 40px 0",
            position: "relative",
          }}
        >
          {/* Mobile-only logo */}
          <div className="auth-mobile-logo" style={{ position: "absolute", top: 24, left: 24 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <span style={{ width: 30, height: 30, background: "#3A6B3A", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <FeatherIcon size={15} color="#fff" />
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-0.01em" }}>Authorr</span>
            </Link>
          </div>

          {/* Right-side studio doodles (wide screens only) */}
          <div aria-hidden className="auth-side-doodle" style={{ ...doodleNote, position: "absolute", top: 16, left: -36, transform: "rotate(2deg)", opacity: 0.7, fontSize: 15 }}>
            ← join 10,000+ writers
          </div>
          <div aria-hidden className="auth-side-doodle" style={{ ...doodleNote, position: "absolute", bottom: 40, right: 4, transform: "rotate(-2deg)", opacity: 0.65, fontSize: 15 }}>
            your words, never locked in ✦
          </div>
          <svg aria-hidden className="auth-side-doodle" style={{ position: "absolute", top: 24, right: 8, pointerEvents: "none" }} width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 1 L12 9.5 L20.5 11 L12 12.5 L11 21 L10 12.5 L1.5 11 L10 9.5 Z" fill="#3A6B3A" opacity="0.35" />
          </svg>

          <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

            {/* Outer heading */}
            <div style={{ textAlign: "center", width: "100%" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.1rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink-900)", margin: "0 0 8px" }}>
                {heading}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--ink-500)", lineHeight: 1.5, margin: 0 }}>
                {sub}
              </p>
            </div>

            {/* Auth card — Clerk widget in the body, brand footer below */}
            <div
              style={{
                width: "100%",
                background: "#fff",
                border: "1px solid var(--line-100)",
                borderRadius: 20,
                boxShadow: "0 4px 24px -4px rgba(26,22,21,0.10), 0 1px 3px rgba(26,22,21,0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "38px 36px 32px" }}>{children}</div>
              <div
                style={{
                  borderTop: "1px solid var(--line-100)",
                  background: "var(--paper-50)",
                  padding: "14px 28px",
                  textAlign: "center",
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  color: "var(--ink-400)",
                }}
              >
                {footerText}{" "}
                <Link href={footerHref} style={{ color: "#3A6B3A", fontWeight: 600, textDecoration: "none" }}>
                  {footerLink}
                </Link>
              </div>
            </div>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--ink-300)", textAlign: "center", lineHeight: 1.6, maxWidth: 300, margin: 0 }}>
              By continuing, you agree to Authorr's{" "}
              <Link href="/terms" style={{ color: "var(--ink-400)", textDecoration: "underline" }}>Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" style={{ color: "var(--ink-400)", textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const doodleNote: React.CSSProperties = {
  fontFamily: "var(--font-doodle), 'Caveat', cursive",
  fontSize: 16,
  color: "#3A6B3A",
  fontWeight: 600,
  lineHeight: 1.3,
  position: "absolute",
  whiteSpace: "nowrap",
};

const FEATURES = [
  { label: "A focused canvas that gets out of your way", icon: <FeatherIcon size={16} /> },
  { label: "Live tone, clarity & grammar as you type", icon: <PenIcon size={16} /> },
  { label: "Every save snapshotted — restore anytime", icon: <ClockIcon size={16} /> },
];

function FeatherIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}
function PenIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function glow(positionCss: string, background: string): React.CSSProperties {
  const out: Record<string, string | number> = { position: "fixed", pointerEvents: "none", zIndex: 0, background };
  for (const decl of positionCss.split(";")) {
    const [k, v] = decl.split(":").map((s) => s.trim());
    if (k && v) out[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as React.CSSProperties;
}

/** Clerk `appearance` override for widgets rendered INSIDE the AuthShell card.
 *  Most sizing is enforced by the global `.cl-*` block above; this zeroes the
 *  wrappers and sets the brand values Clerk reads before our CSS applies. */
export const clerkInCardAppearance = {
  elements: {
    rootBox: { width: "100%", margin: 0, padding: 0 },
    cardBox: { width: "100%", margin: 0, padding: 0, background: "transparent", boxShadow: "none", border: "none" },
    card: { width: "100%", margin: 0, padding: 0, background: "transparent", boxShadow: "none", border: "none" },
    main: { width: "100%", margin: 0, padding: 0, gap: "22px" },
    logoBox: { display: "none" },
    footer: { display: "none" },
    footerAction: { display: "none" },
    headerTitle: { fontSize: "19px", fontWeight: 600 },
    headerSubtitle: { fontSize: "14px" },
    socialButtons: { width: "100%", margin: 0, padding: 0, display: "flex", gap: "12px" },
    socialButtonsBlockButton: { width: "100%", margin: 0, height: "48px", borderRadius: "12px" },
    socialButtonsIconButton: { width: "100%", height: "48px", margin: 0, borderRadius: "12px" },
    dividerRow: { margin: 0, width: "100%" },
    dividerLine: { background: "var(--line-100)" },
    dividerText: { color: "var(--ink-300)", fontSize: "12px" },
    form: { width: "100%", margin: 0, padding: 0, gap: "16px" },
    formFieldRow: { width: "100%", margin: 0 },
    formField: { width: "100%", margin: 0 },
    formFieldLabel: { fontSize: "13px", fontWeight: 600, color: "var(--ink-700)" },
    formFieldInput: { width: "100%", height: "48px", borderRadius: "11px", fontSize: "15px" },
    formButtonPrimary: { width: "100%", height: "44px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, margin: "8px 0 0" },
    formFieldAction: { color: "#3A6B3A" },
    identityPreview: { width: "100%", margin: 0 },
    otpCodeFieldInputs: { width: "100%" },
    alert: { width: "100%", margin: 0 },
  },
} as const;

/** Shown when Clerk keys are not yet configured. */
export function AuthNotConfigured() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--line-100)",
        background: "var(--paper-50)",
        padding: 22,
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.6,
        color: "var(--ink-700)",
      }}
    >
      <strong style={{ color: "var(--ink-900)", display: "block", marginBottom: 8, fontSize: 15 }}>
        Authentication isn't configured yet
      </strong>
      Add your Clerk keys to{" "}
      <code style={{ background: "var(--paper-100, #f4f2ee)", padding: "1px 6px", borderRadius: 5, fontFamily: "monospace", fontSize: 12.5 }}>.env.local</code>
      :
      <pre style={{ marginTop: 12, marginBottom: 12, background: "#fff", border: "1px solid var(--line-100)", borderRadius: 9, padding: "12px 14px", fontSize: 12, overflowX: "auto", color: "#3A6B3A", fontFamily: "monospace" }}>
        {`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…\nCLERK_SECRET_KEY=sk_test_…`}
      </pre>
      Get them from the{" "}
      <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" style={{ color: "#3A6B3A" }}>Clerk dashboard</a>, then restart the dev server.
      <br />
      <Link href="/" style={{ display: "inline-block", marginTop: 14, fontSize: 13.5, color: "var(--ink-400)" }}>← Back to home</Link>
    </div>
  );
}
