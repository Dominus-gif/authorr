import type { Metadata } from "next";
import {
  Inter,
  Source_Serif_4,
  JetBrains_Mono,
  Roboto,
  Open_Sans,
  Source_Sans_3,
  IBM_Plex_Sans,
  Lora,
  Merriweather,
  Playfair_Display,
  Dancing_Script,
  Hanken_Grotesk,
  Onest,
  Caveat,
  Lato,
  Kalam,
  Patrick_Hand,
  Architects_Daughter,
  Shadows_Into_Light,
  Indie_Flower,
  Gochi_Hand,
  Comic_Neue,
  Gloria_Hallelujah,
} from "next/font/google";
import { FONT_STACK_MAP } from "@/lib/fonts";
import { ClerkProvider } from "@clerk/nextjs";
import "katex/dist/katex.min.css";
import "./globals.css";

// All reading fonts are self-hosted via next/font (downloaded at build time,
// no runtime request to Google). Switching is instant — only the
// --font-reading CSS variable changes; the per-font variables are always
// present on <html>.
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const ibmPlex = IBM_Plex_Sans({ variable: "--font-ibm-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin"], weight: ["400", "700"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const dancing = Dancing_Script({ variable: "--font-signature", subsets: ["latin"] });
// Brand-refresh faces for the marketing site (Authorr design system).
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const onest = Onest({ variable: "--font-onest", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Hand-drawn marker face for the marketing studio-sketchbook doodle layer.
const caveat = Caveat({ variable: "--font-doodle", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Template-library body face (used by several professional templates).
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });
// ── Handwriting faces — pair beautifully with the line/dot/graph paper textures ──
const kalam = Kalam({ variable: "--font-kalam", subsets: ["latin"], weight: ["300", "400", "700"] });
const patrickHand = Patrick_Hand({ variable: "--font-patrick-hand", subsets: ["latin"], weight: ["400"] });
const architectsDaughter = Architects_Daughter({ variable: "--font-architects", subsets: ["latin"], weight: ["400"] });
const shadowsIntoLight = Shadows_Into_Light({ variable: "--font-shadows", subsets: ["latin"], weight: ["400"] });
const indieFlower = Indie_Flower({ variable: "--font-indie", subsets: ["latin"], weight: ["400"] });
const gochiHand = Gochi_Hand({ variable: "--font-gochi", subsets: ["latin"], weight: ["400"] });
const comicNeue = Comic_Neue({ variable: "--font-comic-neue", subsets: ["latin"], weight: ["300", "400", "700"] });
const gloriaHallelujah = Gloria_Hallelujah({ variable: "--font-gloria", subsets: ["latin"], weight: ["400"] });

const fontVars = [
  inter,
  sourceSerif,
  jetbrainsMono,
  roboto,
  openSans,
  sourceSans,
  ibmPlex,
  lora,
  merriweather,
  playfair,
  dancing,
  hanken,
  onest,
  caveat,
  lato,
  kalam,
  patrickHand,
  architectsDaughter,
  shadowsIntoLight,
  indieFlower,
  gochiHand,
  comicNeue,
  gloriaHallelujah,
]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "EasyFrame Writer",
  description:
    "A distraction-free, high-performance writing platform for creators.",
};

// Set theme + reading font before paint to avoid a flash of the wrong styling.
const themeScript = `
(function () {
  var STACKS = ${JSON.stringify(FONT_STACK_MAP)};
  try {
    var raw = localStorage.getItem('easyframe-store');
    var theme = 'eclipse', font = 'inter';
    if (raw) {
      var s = JSON.parse(raw).state || {};
      if (s.theme) theme = s.theme;
      if (s.font && STACKS[s.font]) font = s.font;
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--font-reading', STACKS[font]);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'eclipse');
  }
})();
`;

// Auth is enabled only once the Clerk publishable key is present, so the app
// keeps running before keys are configured.
const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Light warm-paper theming for the Clerk widgets — matches the Authorr sign-in/sign-up design.
const clerkAppearance = {
  variables: {
    colorPrimary: "#3A6B3A",
    colorBackground: "#ffffff",
    colorText: "#1a1615",
    colorTextSecondary: "#6b6560",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1615",
    colorNeutral: "#1a1615",
    borderRadius: "10px",
    fontFamily: "var(--font-onest, var(--font-sans), system-ui, sans-serif)",
  },
  elements: {
    card: { boxShadow: "none", background: "transparent", padding: 0 },
    cardBox: { boxShadow: "none" },
    rootBox: { width: "100%" },
    formButtonPrimary: {
      background: "#3A6B3A",
      boxShadow: "0 2px 10px -2px rgba(58,107,58,0.35)",
      "&:hover": { background: "#2d5630" },
    },
    formFieldInput: {
      borderColor: "var(--line-200, #e8e4df)",
      "&:focus": { borderColor: "#3A6B3A", boxShadow: "0 0 0 3px rgba(58,107,58,0.15)" },
    },
    socialButtonsBlockButton: {
      borderColor: "var(--line-200, #e8e4df)",
      background: "#ffffff",
      "&:hover": { background: "#fafaf8" },
    },
    dividerLine: { background: "var(--line-100, #ede9e4)" },
    dividerText: { color: "var(--ink-300, #b5b0a8)" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = (
    <html
      lang="en"
      data-theme="eclipse"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );

  if (!clerkEnabled) return tree;
  // Route auth to our custom in-app pages (not Clerk's hosted Account Portal),
  // so users see the branded AuthShell instead of accounts.dev.
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      {tree}
    </ClerkProvider>
  );
}
