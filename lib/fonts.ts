export interface FontDef {
  id: string;
  label: string;
  /** CSS font-family stack */
  stack: string;
  category: "sans" | "serif" | "mono" | "handwriting";
  note: string;
}

/**
 * Top-10 reading fonts. All except Georgia are loaded from Google Fonts in
 * layout.tsx; Georgia is a system serif fallback. `stack` is what we assign to
 * the --font-reading CSS variable so font switching is instant (no reflow of
 * UI chrome, which stays on Inter).
 */
export const FONT_LIBRARY: FontDef[] = [
  { id: "inter", label: "Inter", stack: "var(--font-sans), system-ui, sans-serif", category: "sans", note: "Modern UI · default" },
  { id: "roboto", label: "Roboto", stack: "var(--font-roboto), system-ui, sans-serif", category: "sans", note: "Clean digital readability" },
  { id: "open-sans", label: "Open Sans", stack: "var(--font-open-sans), system-ui, sans-serif", category: "sans", note: "Neutral web standard" },
  { id: "lato", label: "Lato", stack: "var(--font-lato), system-ui, sans-serif", category: "sans", note: "Warm humanist sans" },
  { id: "source-sans", label: "Source Sans 3", stack: "var(--font-source-sans), system-ui, sans-serif", category: "sans", note: "Source Sans Pro · UI clarity" },
  { id: "helvetica", label: "Helvetica", stack: "Helvetica, 'Helvetica Neue', Arial, sans-serif", category: "sans", note: "Swiss neutral sans" },
  { id: "ibm-plex", label: "IBM Plex Sans", stack: "var(--font-ibm-plex), system-ui, sans-serif", category: "sans", note: "Technical · structured" },
  { id: "lora", label: "Lora", stack: "var(--font-lora), Georgia, serif", category: "serif", note: "Editorial serif body" },
  { id: "merriweather", label: "Merriweather", stack: "var(--font-merriweather), Georgia, serif", category: "serif", note: "Long-form reading" },
  { id: "playfair", label: "Playfair Display", stack: "var(--font-playfair), Georgia, serif", category: "serif", note: "Elegant headings" },
  { id: "georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif", category: "serif", note: "Classic serif fallback" },
  { id: "jetbrains", label: "JetBrains Mono", stack: "var(--font-mono), ui-monospace, monospace", category: "mono", note: "Code · technical" },
  // ── Microsoft Word standard fonts (system-installed; no web load needed) ──
  { id: "calibri", label: "Calibri", stack: "Calibri, 'Segoe UI', system-ui, sans-serif", category: "sans", note: "Word default sans" },
  { id: "cambria", label: "Cambria", stack: "Cambria, Georgia, serif", category: "serif", note: "Word default serif" },
  { id: "arial", label: "Arial", stack: "Arial, Helvetica, sans-serif", category: "sans", note: "Office classic" },
  { id: "times-new-roman", label: "Times New Roman", stack: "'Times New Roman', Times, serif", category: "serif", note: "Office classic serif" },
  { id: "calibri-light", label: "Calibri Light", stack: "'Calibri Light', Calibri, 'Segoe UI', sans-serif", category: "sans", note: "Word headings" },
  { id: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif", category: "sans", note: "High legibility" },
  { id: "tahoma", label: "Tahoma", stack: "Tahoma, Geneva, sans-serif", category: "sans", note: "Compact UI sans" },
  { id: "trebuchet", label: "Trebuchet MS", stack: "'Trebuchet MS', 'Lucida Grande', sans-serif", category: "sans", note: "Humanist sans" },
  { id: "garamond", label: "Garamond", stack: "Garamond, 'Apple Garamond', Georgia, serif", category: "serif", note: "Elegant book serif" },
  { id: "book-antiqua", label: "Book Antiqua", stack: "'Book Antiqua', Palatino, 'Palatino Linotype', serif", category: "serif", note: "Old-style serif" },
  { id: "century-gothic", label: "Century Gothic", stack: "'Century Gothic', 'Apple Gothic', sans-serif", category: "sans", note: "Geometric sans" },
  { id: "segoe-ui", label: "Segoe UI", stack: "'Segoe UI', system-ui, sans-serif", category: "sans", note: "Windows system UI" },
  { id: "consolas", label: "Consolas", stack: "Consolas, 'Courier New', monospace", category: "mono", note: "Office monospace" },
  { id: "courier-new", label: "Courier New", stack: "'Courier New', Courier, monospace", category: "mono", note: "Typewriter mono" },
  { id: "comic-sans", label: "Comic Sans MS", stack: "'Comic Sans MS', 'Comic Sans', cursive", category: "sans", note: "Casual handwriting" },
  // ── Handwriting fonts — designed to pair with the line / dot / graph paper ──
  { id: "caveat", label: "Caveat", stack: "var(--font-doodle), 'Caveat', cursive", category: "handwriting", note: "Natural marker handwriting" },
  { id: "kalam", label: "Kalam", stack: "var(--font-kalam), 'Comic Sans MS', cursive", category: "handwriting", note: "Relaxed everyday hand" },
  { id: "patrick-hand", label: "Patrick Hand", stack: "var(--font-patrick-hand), 'Comic Sans MS', cursive", category: "handwriting", note: "Neat print handwriting" },
  { id: "architects-daughter", label: "Architects Daughter", stack: "var(--font-architects), 'Comic Sans MS', cursive", category: "handwriting", note: "Drafting hand · loves graph paper" },
  { id: "shadows-into-light", label: "Shadows Into Light", stack: "var(--font-shadows), 'Comic Sans MS', cursive", category: "handwriting", note: "Light, airy script" },
  { id: "indie-flower", label: "Indie Flower", stack: "var(--font-indie), 'Comic Sans MS', cursive", category: "handwriting", note: "Bubbly rounded hand" },
  { id: "gochi-hand", label: "Gochi Hand", stack: "var(--font-gochi), 'Comic Sans MS', cursive", category: "handwriting", note: "Bold felt-tip notes" },
  { id: "comic-neue", label: "Comic Neue", stack: "var(--font-comic-neue), 'Comic Sans MS', cursive", category: "handwriting", note: "Tidy comic lettering" },
  { id: "gloria-hallelujah", label: "Gloria Hallelujah", stack: "var(--font-gloria), 'Comic Sans MS', cursive", category: "handwriting", note: "Schoolbook cursive print" },
  { id: "dancing-script", label: "Dancing Script", stack: "var(--font-signature), 'Dancing Script', cursive", category: "handwriting", note: "Flowing signature script" },
];

export const DEFAULT_FONT_ID = "inter";

export function fontStack(id: string): string {
  return (FONT_LIBRARY.find((f) => f.id === id) ?? FONT_LIBRARY[0]).stack;
}

/** id -> stack map, embedded into the no-flash inline script in layout.tsx */
export const FONT_STACK_MAP: Record<string, string> = Object.fromEntries(
  FONT_LIBRARY.map((f) => [f.id, f.stack]),
);
