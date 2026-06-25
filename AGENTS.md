<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# EasyFrame Writer

A distraction-free, high-performance writing platform for creators. Chosen visual
direction: **Eclipse** — near-black surfaces, a single violet accent (`--accent`),
prominent AI editing panel.

## Product name & marketing
Product name is **Authorr**; "EasyFrame Writer" is the internal codename. The public
marketing homepage lives at `app/page.tsx` and the app at `app/app/page.tsx` (`/app`).
The marketing page implements the **Authorr design system** handoff (from the Claude Design
bundle) — a single vibrant **orange** accent (`#ff6b00`), **Hanken Grotesk** display +
**Onest** body (next/font), ultra-thin 1px bento cards, ambient glow. It's themed in the
spec's **LIGHT** direction: warm-paper background (`--paper-50` #fafafa) on a faint 72px
technical **grid** (`.grid-bg`), white cards, deep matte-charcoal ink (`--ink-900` #1a1615),
a warm **hero wash**, and the signature **marker highlight** behind "without the noise".
Emphasis surfaces (`--surface-inverse`: export card + final CTA) invert to charcoal. All
tokens (exact values from the handoff `tokens/*.css`) are scoped under `.authorr-ds` in
`globals.css` so they never touch the Eclipse app theme. The same warm-paper brand also
exists in-app as the selectable **"Authorr" (`paper`) theme**; Eclipse stays the app
default. To re-theme the site dark, flip the `.authorr-ds` token values + the nav rgba.

## Stack
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- TipTap v3 (ProseMirror) for the editor — StarterKit, Placeholder, Typography,
  Image (base64), Link, Underline, TextAlign, Highlight, TaskList/TaskItem, Table,
  plus custom nodes/marks: `Embed`, `Signature`, `Annotation`, `Drawing` (freehand
  doodle), `FontSize`/`FontFamily`/`FontColor` (textStyle attrs), `BlockMover`
  (move/select tool), and `AlignableImage` (Editor.tsx — adds an `align` attr to
  images). All in `components/extensions/`.
- Zustand (with `persist` to localStorage) for state
- Tailwind v4 + CSS custom properties for theming
- lucide-react for icons
- `docx` (Word export) · `diff` (version diff) · `next/font` (10 self-hosted fonts) ·
  `lowlight` (standalone highlight.js for code-block syntax highlighting decorations) ·
  `katex` (inline math/equation rendering — `MathInline` node + `SymbolPicker`)

## Layout
- `app/layout.tsx` — fonts (Inter / Source Serif 4 / JetBrains Mono) and a no-flash
  inline script that reads the persisted theme and sets `data-theme` / `data-font`
  on `<html>` before paint.
- `app/globals.css` — theme tokens for `eclipse` (default) / `light` / `sepia` / `macos` /
  `paper` + 4 glass themes + the **professional palette system** (4 light: `nordic-fog`,
  `earth-studio`, `sage-minimal`, `corporate-clean`; 4 dark: `obsidian-bloom`, `deep-marine`,
  `industrial-slate`, `muted-espresso`), exposed to Tailwind via `@theme inline`, plus all
  `.ProseMirror` editor styling. The palette system is cognitive-ergonomic: low-chroma
  complex neutrals, no pure #000/#fff, hierarchy via surface-tone shifts (borderless), and
  WCAG 2.1 AA verified (text ≥13:1, secondary ≥6.8:1, button text ≥5.3:1 on their surfaces).
  Each theme defines a subtle `--app-grad` body wash; the writing surface uses solid
  `--bg-elev` so text contrast is unaffected. Glass-theme gradients are muted.
  `ThemeMenu.tsx` is the grouped Light/Dark theme dropdown (TopBar); add a theme by adding a
  `[data-theme="…"]` block, a `ThemeName` union member, and a `ThemeMenu` LIGHT/DARK entry.
- `lib/store.ts` — single Zustand store: document tree, active doc, theme/font,
  zen/split/panel toggles, save status. Tree mutations are immutable helpers.
- `lib/stats.ts` — word/char/paragraph/reading-time (200 WPM).
- `lib/analyze.ts` — **local heuristic** tone/clarity/grammar analysis. This is the
  offline placeholder for the Claude-powered AI suite; replace/augment with the
  API in the services phase.
- `lib/fonts.ts` — reading-font library: 10 self-hosted (`next/font`) + the standard
  Microsoft Word system fonts (Calibri/Cambria/Arial/Times New Roman/Verdana/Tahoma/
  Trebuchet/Garamond/Consolas…, plain system stacks, no web load). Switching swaps the
  `--font-reading` CSS var.
- `lib/efformat.ts` — `.ef` container: base64-wrapped JSON payload (HTML + PM JSON +
  version metadata) with a djb2 integrity signature. Integrity, not encryption —
  real encryption needs key management (services phase).
- `lib/export.ts` — PDF (print window), DOCX (`docx` from PM JSON), Markdown, TXT.
- `lib/embeds.ts` — trusted-domain whitelist (YouTube/Vimeo/Wikipedia/GitHub/Medium/X)
  + provider/iframe resolution.
- `components/Workspace.tsx` — orchestrator: zen mode (fade-on-type + edge reveal),
  split view, hydration gate.
- `components/Editor.tsx` — TipTap instance, debounced (800ms) autosave to store.
- `components/SlashMenu.tsx` — custom `/` command menu (no suggestion plugin);
  includes Image (file picker) and Embed link (whitelist-validated) commands.
- `components/{TopBar,Sidebar,AIPanel,StatsBar}.tsx`.
- `components/FontPicker.tsx` — reading-font dropdown (previews each typeface).
- `components/ExportMenu.tsx` — `.ef` save / open + PDF/DOCX/MD/TXT export.
- `components/VersionHistory.tsx` — snapshot timeline + visual `diff` (green/red).
- `components/EditorContext.tsx` — shares the TipTap instance with the top bar/dialogs.
- Save lifecycle is Saving → Saved → Synced; snapshots are pushed on save
  (coalesced within 25s, capped 60) and record the acting user — see `store.ts`
  `pushVersion`/`restoreVersion`.
- `components/Toolbar.tsx` — rich formatting bar (B/I/U/S, highlight, headings,
  align, lists, checklist, table, image, signature, link, line-numbers, print).
- `components/ContextMenu.tsx` — right-click menu (improve/grammar/tone stubs →
  toast, highlight, pen annotate, ask-@user, version history).
- `components/{AssignRequest,RequestsPanel,Toast}.tsx` — targeted edit-request flow.
- Identity/role model lives in `store.ts` (`users`, `currentUserId`, `editTasks`);
  `SEED_USERS` simulates author + collaborators. The TopBar `UserSwitcher` flips
  identity so role-aware behavior (author vs user) can be exercised locally.
- Color-coded folders/notes: `TreeNode.color` + `NODE_COLORS` (lib/types), palette
  popover in `Sidebar.tsx`. Line numbers: `lineNumbers` flag + `.line-numbers` CSS.
- In-document request markers: assigning sets an `Annotation` mark carrying
  `taskId`/`initial`; CSS `span[data-assigned]::after` renders the assignee avatar
  dot (uses an inline `--ini` var, NOT `attr()` — Lightning CSS drops `attr()` in
  `content`). Clicking a marker opens `RequestDetail.tsx` (View in document / Show
  version history / status). `EditTask.status` is pending|in_progress|completed.
- Edit-request inbox (`RequestsPanel.tsx`) main tabs are just Pending / Requires
  review / Approved; Rejected + full history live behind the "Show all" button
  (`RequestsTimeline.tsx`, version-control-style, grouped by status with
  type/timestamp/requested-change/outcome).
- Edit-request confirmation flow (`RequestDetail.tsx`): every task carries a sequential
  `EditTask.ref` (`store.taskSeq`), shown as "#N" in the dialog + inbox. Accept ≠ done:
  pending → Accept moves to `in_progress` and re-highlights/selects the anchored text;
  the assignee edits, then clicks **Changes made** → `approved`. Also Reject→rejected,
  Needs changes→needs_review (author then Approve/Reject). "Mark for my review" in the
  ContextMenu self-assigns a review task + anchors a marker, no dialog.
- `EditTask.kind` is `amend|review` ("Request review…" in the context menu).
- Admin dashboard (`AdminDashboard.tsx`, `store.adminDashboardOpen`, author-only TopBar
  `LayoutDashboard` btn): KPI cards (team size / assigned today / pending / completed),
  hand-rolled SVG charts (status donut, 7-day activity bars, per-user load bars) + a
  user roster — all computed live from `editTasks`/`users`, no chart lib.
- No native browser dialogs: `window.prompt/alert/confirm` are replaced by an
  in-app `PromptDialog.tsx` driven by `store.promptDialog` (`openPrompt`/`closePrompt`;
  `input:false` = confirm mode). Used by Signature, link, embed, upload.
- Toolbar annotation tools: Font color (`TextColorTool` popover → `setFontColor`/
  `unsetFontColor` on textStyle, with swatches + a native `<input type=color>` custom
  palette), Highlight (pen), Paint bucket (fill-color popover, `setHighlight`),
  Eraser (`unsetHighlight`+`unsetAnnotation`), Clear formatting. Plus `TextCaseTool`
  (UPPER/lower/Sentence via the `TextCase` extension `transformCase`, mark-preserving),
  `LetterSpacingTool` (`LetterSpacing` textStyle attr), and a shared `ToolPopover`.
- Font size scale goes to 96 (`FONT_SIZES` in Toolbar). Extensions are thin textStyle
  global-attr wrappers: `FontSize`/`FontFamily`/`FontColor`/`LetterSpacing`.
- Code blocks: `CodeBlockStyled` (extends `@tiptap/extension-code-block`, StarterKit's
  is disabled) sets `marks: "_"` so ALL marks work inside code (bold/italic/underline/
  strike + textStyle font/size/color + highlight bg fill) and adds `fontFamily`/
  `codeColor`/`background` attrs; `CodeHighlight` is the lowlight decoration plugin
  (auto language detection). `CodeStyleTool` popover edits language/font/color/bg.
- Code/quote on a PARTIAL selection only affect the selected text: `SelectionBlocks`
  (`codeBlockSelection`/`blockquoteSelection`) splits the block at the selection bounds
  then converts/wraps just the isolated middle block (avoids swallowing the paragraph).
- Find & Replace: `SearchReplace` extension (results in `editor.storage.searchReplace`,
  decoration plugin highlights `.search-match`/`.search-current`, recomputes on doc
  change) + the `FindReplace.tsx` floating panel (`store.findReplaceOpen`, Search btn, or
  **Ctrl/Cmd+F** — a window keydown handler in `Workspace` opens it and preventDefaults the
  browser's native find; the panel auto-focuses its input).
- Page-wide doodle: `DoodleOverlay.tsx` (`store.doodleMode` + `pageDoodles`) — a
  fixed full-viewport SVG you draw anywhere over the app. Pen = clean ink; pencil =
  realistic graphite (layered semi-transparent paths through an feTurbulence
  `#pencil-grain` displacement filter). Toolbar `Pencil` btn toggles it; strokes are
  ephemeral (not persisted), pointer-events pass through when idle.
- Tables: `StyledTable` (Editor.tsx) extends Table with border width/color/style +
  header tint as CSS vars (`--tbl-bw/-bc/-bs/-header-bg`); the `TablePropsTool` popover
  (shown when in a table) edits them and offers add/del row/col + delete/toggle header.
  The `resizable` TableView node view ignores attribute-rendered styles, so the vars are
  pushed onto the `.tableWrapper` via a node **decoration** and inherit down to cells;
  cell-border longhands use `var(--tbl-bw, 1px)` fallbacks (NOT a value set on `<table>`,
  which would shadow the inherited override). Lightning CSS also drops an all-`var()`
  `border` shorthand, hence longhands.
- Freehand doodle (`Brush` toolbar btn / `/doodle` slash cmd → `insertDrawing`):
  the `Drawing` atom node hosts an SVG pointer-draw canvas (per-stroke color/width,
  eraser, undo, clear, L/C/R align). Strokes persist as JSON in `data-strokes` for
  reload and as an inline SVG data-URI `<img>` for export/print fidelity.
- Move/select tool (`MousePointerSquareDashed` toolbar btn → `store.moveMode`, adds
  `.move-mode`). `BlockMover` (PM plugin) is **pointer-drag based** (NOT native HTML5
  drag, which copied): pointerdown on a block records it (block resolved from the event
  target via `posAtDOM`), a `.pm-drop-indicator` line tracks the drop point, and on
  pointerup a single `delete`+`insert` transaction *moves* the block. Auto-scrolls (rAF)
  when the pointer nears the scroll-container edge. The toolbar align buttons set the
  `align` attr on a selected image/doodle node, else `setTextAlign`.
- Doodles are content-anchored: `[data-doodle-scope]` is the FIXED-WIDTH 720px content
  wrapper (not the `[data-editor-scroll]` scroller), so `DoodleOverlay` strokes scroll
  with the text AND stay locked on window resize — each stroke records the column width
  (`PageStroke.cw`) and its X is scaled proportionally when the column resizes. Wheel
  still scrolls; the doodle toolbar is drag-moveable. The in-document freehand `Drawing`
  node insert was removed (the node stays registered for old content).
- Review markers (`ScrollMarkers`): a STATIC fixed rail (re-anchored to the
  `[data-editor-scroll]` viewport on scroll/resize, so ticks never scroll away) with one
  colored tick per `span[data-task]`. Hover shows a tooltip (requester + note + "Expand
  details" → opens the task); click scrolls to the text and applies the `.review-spotlight`
  5-second highlight. "View in document" in `RequestDetail` uses the same 5s spotlight.
- Special chars & equations: `SymbolPicker` dialog (`store.symbolPickerOpen`, Σ toolbar
  btn) — unicode character grid + a KaTeX equation builder; equations insert as the
  `MathInline` atom node (stores LaTeX in `data-latex`, renders via KaTeX node view).
- Translation: `TranslatePanel` (`store.translateOpen`, Languages toolbar btn) translates
  the selection/document into 10 work languages via the free MyMemory API (chunked to its
  450-char cap; surfaces the daily-quota message). Copy or insert the result.
- Notes & research is now `NotesPanel` (contenteditable, HTML in `store.notes`) accepting
  pasted/dropped images (base64) and clipboard rich content.
- Mini web browser: `BrowserPane` (URL bar + iframe + Wikipedia CORS "Key points"
  extractor) lives EXCLUSIVELY inside the split-view `SidePanel.tsx` (Notes / Browser /
  Split tabs) — there is no standalone toolbar button or floating window. Real AI
  summarization of arbitrary sites needs the Claude API. (`WebBrowser.tsx` still exports a
  floating-window variant but it is unmounted.)
- Tabbed side panel (`SidePanel.tsx`, shown in split view): Notes (`NotesPanel`) +
  the browser (`BrowserPane`) as tabs, or a stacked Split layout (notes top, browser below).
- Version history adds: clicking an addition/deletion in the diff scrolls the live doc to
  that text (closes the panel) and drops a temporary `.review-spotlight-overlay` highlight
  box inside `[data-doodle-scope]` (an overlay, NOT a class on a PM node — PM reconciles
  those away). `goToDoc` resolves the anchor against a FLATTENED doc (text nodes concatenated
  with a char→pos map) so phrases spanning multiple text nodes (across marks) still match —
  a plain single-node `indexOf` silently failed before; deletions anchor on the nearest
  unchanged text (prev, then next). Both the diff text spans AND the green/red change-rail
  ticks call `goToDoc` (hovering a tick scrolls the diff to it). Versions snapshot full
  `getHTML()` so images/links/tables restore. `textFromHtml` emits `⟦Image⟧`/`⟦Table⟧`/…
  tokens so element deletions show.
- Static review rail (`ScrollMarkers`): one tick per review/edit marker AND per anchored
  comment (`span[data-comment-id]`, a calm blue tick; hover shows the comment author + text,
  click jumps). Hover keeps the tooltip up for 3s (timer) so you can reach the
  "Jump to change" / "Expand details" buttons; the `.review-spotlight` jump highlight is
  bright (fill + outline + glow). The in-text comment glyph is a masked-SVG speech bubble in
  `--accent` (`.has-comment::after`), NOT an emoji. Dropdowns (`ExportMenu`, `EditionMenu`,
  `UserSwitcher`) use `lib/useDropdownPos` (fixed, viewport-clamped, re-placed on resize)
  and the context menu measures itself and re-clamps on resize — no off-screen clipping.
  All TopBar dropdowns (`ModeSwitcher`/`ThemeMenu`/`EditionMenu`/`ExportMenu`/`UserSwitcher`)
  render their panel via `createPortal(..., document.body)` with `z-index:1000` + an
  `onMouseDown` stop-propagation: the header's `background: var(--bg-elev)` matches the glass
  `[style*="bg-elev"]` backdrop-filter rule, which creates a stacking context that would
  otherwise trap the fixed dropdown inside the 52px header and let the Toolbar paint over it. The
  inbox (`RequestsPanel`) clamps to `calc(100vh - 88px)` with responsive padding and its body
  is `flex:1; min-height:0; overflow-y:auto` so long lists scroll instead of overflowing.
- Comments: `Comment` mark — a dedicated Toolbar button (`MessageSquarePlus`, "Add comment to
  selection") AND the ContextMenu "Add comment" both `openPrompt` then `setComment` on the
  selection; renders a `.has-comment` highlight + 💬 icon; `CommentTooltip.tsx` reveals it on hover.
- Navigation: `DocOutline.tsx` (TopBar `ListTree`, `store.outlineOpen`) auto-lists headings
  for click-to-scroll. Bookmarks: TopBar `Bookmark` saves the editor scroll ratio per doc
  (`store.bookmarks`, persisted); Workspace restores it when the doc opens.
- Cloud & autosave: `CloudDialog.tsx` simulates connecting Google Drive/Dropbox/OneDrive/
  iCloud/Box (`store.connectedClouds`) + a timed autosave toggle (`autosaveEnabled`/
  `autosaveMinutes`; Workspace interval snapshots a version + "syncs"). Opened from the
  bottom-left hub (no longer a TopBar button).
- Bottom-left hub (`SidebarFooter.tsx`, pinned under the doc tree): account (sign in/up —
  `AccountDialog`, simulated), Templates (`TemplatesDialog`), Trash, Archive (`RequestsTimeline`),
  Cloud. The portaled menu escapes the sidebar's stacking context.
- Trash: `deleteNode` moves docs/folders to `store.trash` for **30 days** WITH their version
  history; `TrashDialog.tsx` shows days-left + restore (recovers the node and its versions via
  `restoreFromTrash`) or permanent delete. Items past 30 days are pruned on the next delete.
- Templates: `lib/templates.ts` has 50 professionally-designed templates (Business / Legal /
  Academic / HR & Career / Product & Marketing). Each follows a per-template spec: a named
  palette (Executive Navy / Emerald Corporate / Charcoal Minimalist / Legal Charcoal / Deep
  Navy / Oxbridge Burgundy / Ivy League Navy / Monochrome Draft — the `PAL` map), a font
  pairing (rendered as a "Type pairing —" note), and a real document structure built from
  palette-colored headings (textStyle color spans, so they survive TipTap's schema), tables
  (financial micro-grids, RACI, synthesis matrices), blockquote callouts, task-list
  checklists, and signature blocks. `card.accent` = the palette primary. `TemplatesDialog.tsx`
  is a Canva-like grid by category with search; `createFromTemplate` spins up a new doc.
- Page fill: `PageFillTool` (Toolbar, `PaintRoller` icon, next to the text Paint bucket) fills
  the active document's page/canvas with a chosen color. Color is stored **per document** in
  `store.pageColors` (`Record<docId, color>`, persisted); `setPageColor` targets the active
  doc only, and `Workspace` applies `pageColors[doc.id]` as `background` on the
  `[data-doodle-scope]` column — so each doc keeps its own page color. Swatches + custom
  `<input type=color>` + "Reset to theme". Distinct from the Paint bucket (text highlight only).
- Paper texture: `LayoutControls` (left "Page & layout" panel) has a 4-up swatch grid —
  Plain / Lines (ruled) / Dots (dotted grid) / Graph (graph paper). Stored **per document**
  in `store.paperTextures` (`Record<docId, PaperTexture>`, persisted; `"plain"` = absent);
  `setPaperTexture` targets the active doc. `Workspace` sets `data-paper-texture` on the
  `[data-doodle-scope]` column; `globals.css` draws each as a `background-image` (rules placed
  AFTER page-borders/infinite-canvas so the texture re-asserts over their `background`
  shorthand). The page-fill color is now applied as `backgroundColor` (not the `background`
  shorthand) so a texture's image layers on top of it. Line colour derives from `--text` via
  `color-mix` so it reads on light + dark. "Lines" also snaps `.ProseMirror p/li` to a 32px
  line-height so text sits on the rules. 10 **handwriting fonts** (Caveat, Kalam, Patrick Hand,
  Architects Daughter, Shadows Into Light, Indie Flower, Gochi Hand, Comic Neue, Gloria
  Hallelujah, Dancing Script) were added to `lib/fonts.ts` (`category: "handwriting"`) +
  `layout.tsx` (next/font) + `export.ts` print map — they pair with the grid/line paper.
- Bottom-left hub: Templates and Trash are now their own standalone buttons in `SidebarFooter`
  (a row above the account button); the account dropdown holds only Account / Archive / Cloud.
- The page-doodle toolbar (`DoodleOverlay`) opens centered at the bottom of the viewport
  (`bottom:24, left:50%`); still drag-moveable.
- Marketing site studio-sketchbook layer: `app/page.tsx` `Doodle` + `DoodleArrow` render
  hand-drawn marker annotations (Caveat `--font-doodle`, loaded in `layout.tsx`) with curved
  SVG arrows that point at the headline, AI panel, and final CTA. `.ds-doodle` (globals.css,
  `.authorr-ds` scope) handles the float animation and hides them under 920px.
- Marketing animations use **Framer Motion** (`motion` pkg, `motion/react`), per the handoff's
  `Anim.jsx`/`Pricing.jsx`. `components/marketing/Reveal.tsx` is the fade+rise primitive
  (`immediate` = animate on mount for above-the-fold; else `whileInView` once, margin -70px;
  EASE `[0.22,1,0.36,1]`). CRITICAL: its static fallback renders a **plain** tag (not a motion
  element) when reduced-motion OR `document.hidden` at mount — Motion pauses rAF while a tab is
  hidden, so a motion fallback would leave content stuck at opacity:0 (headless/background tab).
  The old CSS `.reveal`/`RevealInit` IntersectionObserver mechanism was removed. Pricing is now
  `components/marketing/PricingPlans.tsx` (client): a Monthly/Yearly billing toggle with a
  spring-animated indicator (`type:"spring"`), 20%-off yearly prices with strike-through +
  "billed yearly" notes, and the Personal BYOK box. The Export bento card is kept **white** (per
  the user) even though the handoff marks it `variant="inverse"` (dark).
- Layout (`LayoutControls.tsx`, left panel, **expanded by default** — component state resets
  open on every refresh): a Browse-templates button, the full page-size set from
  `lib/pageSizes.ts` (US: Letter/Legal/Tabloid/Executive/Statement · ISO: A3/A4/A5/B5 — each
  `id → {label, dim, width(px@96dpi), css}`; `store.pageSize` sets the content-column width via
  `pageWidth()`), an `infiniteCanvas` toggle, and Insert page break (`PageBreak` extension keeps
  `data-page-break` on an `<hr>`; CSS labels it + `break-after:page`).
- Infinite canvas (`data-infinite-canvas` on the doodle scope): truly full-width AND full-height
  (`min-height: calc(100vh - 200px)`) free-form surface with a faint dot-grid background; page
  borders + page-break are disabled in this mode. The doodle/move tools work across the whole canvas.
- `exportPdf` takes the page size (maps to `@page { size }` via `PAGE_SIZES[id].css`), supports
  page breaks, auto-triggers print, and renders screenplay elements — so "Export PDF" formats +
  prints directly.
- Live embeds: `CodeEmbed` atom node + `EmbedDialog.tsx` (slash "Live data / code") embed a
  remote URL (chart/viz/table) OR run inline HTML/JS in a sandboxed iframe.
- Stale tasks: the Editor save cycle flags any open task whose anchor marker vanished
  (`store.markTaskStale` records who amended it); `RequestDetail` shows "No longer available"
  and `RequestsTimeline` has an "Archived · unavailable" group with the amender record.
- New-doc AI summary: `lib/summarize.ts` (local extractive) drives a "Document summary"
  section in `AIPanel` — auto-shows onboarding intent for near-empty docs, on demand otherwise.
- Glass themes refined: ~88% opaque surfaces, gentle `blur(6px)`, a 1px inset top-highlight
  "glass edge"; writing surface + buttons stay un-blurred.
- Editor context menu (`ContextMenu.tsx`) leads with Cut/Copy/Paste (Copy/Cut via
  `document.execCommand` on the restored selection; Paste via `navigator.clipboard.readText`).
- Version history (`VersionHistory.tsx`) serializes non-text elements to bracket tokens
  (`⟦Image⟧`/`⟦Table r×c⟧`/`⟦Doodle⟧`/`⟦Equation⟧`/`⟦Divider⟧`…) so deleting an element shows
  as a removal in the word diff instead of vanishing.
- Admin dashboard: a **Last 7d / 30d / All time** interval selector drives the KPI/metric
  cards; the calendar is minimized behind a Calendar toggle. In the calendar, clicking a
  date opens `DayDetail` (that day's tasks + member filter chips); clicking a roster member
  opens `UserDetail` with completed/pending/rejected + approval-rate insights.
- Glassmorphism themes are tuned subtle/professional: surfaces are ~88% opaque (readable,
  not see-through), muted gradients, and a gentle `blur(7px)` on elevated surfaces (writing
  surface + buttons exempted so text stays crisp).
- Toolbar perf: editor `transaction`/`selectionUpdate` re-renders are coalesced to one per
  animation frame (rAF), and the native color inputs are rAF-throttled — so color picking
  and typing stay snappy instead of re-running every `can()`/`isActive` check per keystroke.
- Print/export fonts: `exportPdf` injects a `:root` block resolving the app's next/font
  CSS vars (`--font-roboto`, etc.) to real families + a Google Fonts `<link>`, so selected
  fonts render in the print window instead of defaults.
- Admin dashboard adds: click a user → their task list; a navigable month **calendar** of
  task history; inline **role assignment** (`store.setUserRole`) that queues a `RoleNotice`
  delivered as a toast when that user next logs in (`setCurrentUser`).
- Public share links carry `ShareConfig.expiresAt` (`setShareExpiry`, options in
  `ShareDialog`); `SharePreview` shows an "expired" state past the deadline.
- Sharing (`ShareDialog.tsx` + Share button): per-doc `store.shares` with visibility
  Public/Private/One-time + a simulated link. "Preview recipient view" opens
  `SharePreview.tsx` (faux read-only webpage + sign-in-to-edit). Requesting access →
  `accessRequests` → author Accept/Deny in the inbox → `resolveAccessRequest`
  issues an 8-digit ID tied to that doc+user. Real cross-device links need backend.
- Table editing: right-click in a cell → add/delete row/column, delete table
  (ContextMenu detects `td/th` + uses `posAtCoords` for the target cell). Toolbar
  has Clear formatting; context menu has Erase formatting + Highlight (pen).
- Themes: eclipse/light/sepia/**macos**/paper + 4 **glassmorphism** themes
  (`glass-aurora|mint|sunset|frost`): translucent rgba tokens, a fixed `--glass-grad`
  body gradient, and `backdrop-filter: blur()` applied to any surface whose inline
  style references an elevation token (`[data-theme^="glass-"] [style*="bg-elev"]`).
  (`globals.css` + TopBar `THEMES`.)
- `UploadButton.tsx` (next to ExportMenu) opens a `.ef` directly into the editor.
- FontPicker reflects the SELECTION's applied font when text is selected (fixes
  the "shows default" bug). Print/export fidelity (`lib/export.ts` `exportPdf`)
  includes table borders, highlight colors (`print-color-adjust:exact`), and the
  Signature renders cursive in `renderHTML` so it matches on-screen.
- `components/{RequestDetail,DocMetadata}.tsx`; document metadata lives on `TreeNode`
  (createdAt/creatorId/editCount/contributors), surfaced via the TopBar info button.
- Toolbar font cluster: `FontPicker` (family) + `FontSize` extension (per-selection,
  on the textStyle mark). `aiPanelOpen` is now persisted. Signature node upgraded
  with a cursive font (`--font-signature`, Dancing Script) + a hex integrity key.
- Request markers DON'T block editing: clicking the highlighted text places the
  caret; only clicking the avatar dot (right ~18px of the span, detected by clientX
  in `Editor.tsx`) opens the task. `FontFamily` extension applies font per-selection
  when text is selected, else `FontPicker` changes the global reading font.
- Auto-naming: `autoTitle(docId, firstLine)` renames a doc from its first line until
  the user manually renames (`TreeNode.manualTitle`). Runs in the editor save cycle.
- Restore approval: non-authors' restores create a `RestoreRequest` (store) routed to
  the author's inbox (`RequestsPanel` "Restore approvals" → approve applies +
  `requestReload()` so the open editor refreshes via `reloadNonce`). Authors restore
  directly. Detached tasks: `RequestDetail` detects when a task's annotation no longer
  exists in the active doc and offers reassign-to-selection / archive (undo auto-relinks).

## Workspace modes (top-left switcher)
- `store.workMode` (`scriptwriting`|`professional`|`academic`|`casual`, default professional)
  via `ModeSwitcher.tsx` (top-left dropdown). The right-hand panel swaps by mode in
  `Workspace.tsx`: `ProfessionalPanel` / `ScriptPanel` / `AcademicPanel` / `CasualPanel`
  (else `AIPanel`).
- **Professional** (`ProfessionalPanel` + `lib/prowriting.ts`): a composite **writing score**
  (SVG gauge), Flesch reading-ease + grade, sentence-length variety bar map, sticky/glue-word
  sentences (>45% glue), business-jargon filter with replacements, passive-voice count, and a
  word-choice card (overused words, -ly adverbs, vague/filler).
- **Scriptwriting** (`Screenplay` extension + `ScriptPanel`): `Screenplay` adds `sceneElement`
  (scene/action/shot/character/parenthetical/dialogue/transition) + a `dual` global attr on
  paragraphs; **Tab** cycles the element, **Enter** auto-advances (Character→Dialogue→Action),
  styled via CSS scoped to `[data-script-mode]` (Courier, screenplay margins, auto-casing).
  `[data-scene-numbers]` (store `sceneNumbers`) adds a CSS-counter scene number; `dual="L"/"R"`
  floats two speakers side by side. Active only when `editor.storage.screenplay.active`.
  `ScriptPanel` (Final Draft-style) parses the doc live for: element buttons, scene-number
  toggle + dual-dialogue + character-extension chips ((V.O.)/(O.S.)/(CONT'D)), scene/location/
  time SmartType autocomplete, dialogue tuner (per-character lines, click-to-jump), a scene
  navigator with page estimate + title-page insert, a character report (lines · scenes),
  revision colors, and a downloadable breakdown report.
- **Academic** (`AcademicPanel` + `Corkboard`): a writing target (word goal + progress),
  citation library (`store.citations`) with an APA/MLA style toggle (inline `(Author, Year)`
  + auto References/Works-Cited), section snapshots (via `pushVersion`), `Corkboard.tsx`
  index-card view of the doc tree, and the sidebar as the Binder; "Split editor" reuses split view.
- **Casual**: the AI editing suite (`AIPanel` with a `casual` prop) is restored as the default
  panel — full tone/clarity/grammar/summary tools plus a daily journal prompt + zen/doodle shortcuts.
- The AI editing suite is reachable in ANY mode via the `AiToolsSwitch` pill IN each panel's
  header (sets `store.aiSuiteOverride` to force `AIPanel` over the mode panel, toggles back to
  Tools). The top bar has ONE `PanelRight` show/hide button — the old separate top-bar AI
  button was removed so the two no longer overlap/conflict.
- Page zoom: `store.zoom` (0.5–2.0) — top-bar slider with −/+ buttons + reset; applies CSS
  `zoom` to `[data-doodle-scope]`; `DoodleOverlay.toContent` divides pointer coords by `zoom`
  so strokes stay in unscaled content space.
- Page borders (`store.pageBorders`, `SquarePen` top-bar toggle): `[data-page-borders]` on the
  content column gives it a paper-page look (border + shadow + padding) to distinguish page
  from canvas.
- **Autocorrect** (`Autocorrect` extension, `store.autocorrect`, top-bar SpellCheck toggle):
  an `appendTransaction` plugin (NOT `handleTextInput`, which misses programmatic input)
  fixes ~70 common typos, capitalizes "i", and capitalizes sentence-initial words on word
  boundaries; gated by `editor.storage.autocorrect.enabled`.
- **`M` hotkey** (Workspace keydown): cycles the 4 glass themes when not focused in an
  editable field.

## Conventions
- Theme colors come from CSS vars (`var(--accent)`, `var(--bg-elev)`, etc.) — never
  hardcode hex in components. Add new themes by adding a `[data-theme="…"]` block.
- The reading font is `var(--font-reading)`, switched via `data-font` independently
  of the UI font.

## Plans & entitlements (freemium — local simulation)
- `lib/plans.ts` — billing plans **Free / Pro / Team** (`Plan`), a `Feature` union, and
  `planAllows(plan, feature)` (Pro unlocks all premium; collaboration/sharing/teamDashboard
  are Team-tier). Free metadata name is "Free". Separate axis from `edition`
  (Personal/Workspace, the collaboration toggle). Also exports `FREE_THEMES` (light + eclipse),
  `FREE_EXPORTS` (txt + md), `FREE_WORKMODE` (casual), `FREE_MAX_FOLDERS`/`FREE_MAX_DOCS`
  (1 / 3), `FEATURE_LABEL`, `PLAN_META`, and `DEFAULT_GRID`.
- `store.plan` (persisted, default `free`) + `setPlan`. `store.requireFeature(feature)` returns
  true if allowed, else sets `store.gate` (the upgrade modal key: a `Feature`, `"storage"`, or
  null) and returns false — the gating primitive used at every premium entry point.
  `PlanUpgradeModal.tsx` (rendered in `Workspace`) is the Pro-targeted upgrade modal driven by
  `gate`; upgrading calls `setPlan` (instant + local).
- Free locks (each opens the modal via `requireFeature`): premium themes (`ThemeMenu`, lock
  badges), PDF/Word/.ef exports (`ExportMenu`; txt+md stay free), non-casual work modes
  (`ModeSwitcher`; `Workspace` also normalizes a persisted premium mode back to casual), the AI
  suite (`AIPanel` shows an upgrade card for Free but keeps the casual journal/zen/doodle
  extras; the top-bar **AI Action button** gates `aiSuite`), templates (`SidebarFooter`),
  paper textures + page-fill "canvas background" (`LayoutControls` / `PageFillTool`), page
  layouts/sizes/breaks/margins + advanced grid (`LayoutControls`), version history / passcode /
  share / admin dashboard (`TopBar`), the `M`-key glass cycle (`Workspace`), and doc/folder
  creation past the cap (`store.addDoc`/`addFolder` → `gate:"storage"`).
- Grid/canvas customization (Pro): `store.grid` (`GridSettings`: cellSize, dotDistance, color,
  opacity, locked) + `setGrid`, and `store.pageMargin` + `setPageMargin`. `Workspace` applies
  them as inline CSS vars (`--paper-rule`/`--paper-rule-strong`/`--paper-cell`/`--paper-dot-gap`)
  on the `[data-doodle-scope]` column; the texture + infinite-canvas CSS read those vars. Grid
  color is `color-mix(var(--text) …)` by default so it **auto-inverts** on theme change; setting
  a custom color pins it (`locked`) so it survives theme switches. Controls live in
  `LayoutControls` ("Grid & canvas" + "Page margins"), gated for Free.
- AI **Key Management** (Pro): `store.apiKeys` (`ApiKey[]`) + `activeApiKeyId` (null = app
  default key, active until the user switches) with `addApiKey`/`deleteApiKey`/`renameApiKey`/
  `setActiveApiKey`. Managed in `AccountDialog` → **API keys** tab.
- Free-plan UI is **hidden, not just gated**: `TopBar` drops share/version-history/bookmark/
  autocorrect/inbox/split/dashboard, `Toolbar` drops Translate, `SidebarFooter` drops Templates,
  `LayoutControls` returns null, and `DocMetadata` hides the Personal/Team collab selector. A
  `PlanBadge` by the edition switcher shows the tier + a basics popover. The right-sidebar toggle
  was removed — the top-right AI button now also show/hides the panel.
- Team governance (`AdminDashboard` → `TeamGovernance`): a folder/file **activity log**
  (`store.activityLog`, recorded in `addDoc`/`addFolder`/`deleteNode`, capped 200) + a per-folder
  **permission hierarchy** (`store.folderPermissions` + `folderPermissionFor`, which walks up the
  tree; `setFolderPermission`). Create/delete are enforced in those store actions (author always
  allowed). Collab modes are Personal/Team only (no Client).
- Canvas/print: infinite canvas now draws a continuous **line grid** (was dots); page mode shows
  **dashed margin guides** (`--guide-x/-y`); the grid/margin sliders use `.pro-range`; `exportPdf`
  takes an optional `PrintPaper` so textures print; `AiToolsSwitch` is a 2-segment Tools/AI toggle.
- UI relocations: the top-right **identity/role switcher was removed** from `TopBar` and lives
  in the bottom-left **account center** (`AccountDialog`, opened from `SidebarFooter`), now a
  tabbed dialog — **Profile** (sign in/up + identity switch), **Billing** (plan select/upgrade),
  **API keys** (Key Management). The top-right now hosts the accent **AI Action button**.

## Editions, RBAC & security (local simulation)
- Two editions (`store.edition`): **Personal** (collaboration off until an invite
  code is accepted → `collabUnlocked`) and **Workspace** (full collaboration on).
  `EditionMenu.tsx` switches them; `CollabDialog.tsx` does invite generate/accept;
  `UpgradePrompt.tsx` fires when a Personal user hits a Workspace-only feature.
- RBAC in `lib/permissions.ts` (`canEdit`/`canMention`/`canShare`/`canManageWorkspace`)
  over roles author / co-author / user / viewer (`ROLE_META`). Editor is set
  read-only for user/viewer (`editor.setEditable`), with a banner; @mention/assign
  is gated by `canMention` (routes to CollabDialog or UpgradePrompt).
- Passcode protection: `TreeNode.passcodeHash` (djb2, prototype not real crypto) via
  `PasscodeDialog.tsx`; `LockScreen.tsx` overlays a locked doc until unlocked into the
  ephemeral `unlockedDocs` (cleared on reload). Auto-lock after `autoLockMinutes` of
  inactivity (configurable) via a Workspace timer.
- Per-doc collaboration mode (`TreeNode.collabMode` personal|team, toggled in
  `DocMetadata.tsx`) keeps team edits separate from personal drafts. Personal plan
  caps: 5 invites (`personalTeamCount`/`PERSONAL_MAX_INVITES`, enforced in
  `acceptInvite`) and 50 collaborative edits/day (`collabEdits` +
  `PERSONAL_DAILY_COLLAB_LIMIT`; `recordCollabEdit` on team-doc saves;
  `personalCollabLimitReached`/`collabEditsRemaining` selectors). Over the cap the
  editor goes read-only with the daily-limit banner; Workspace edition has no caps.
- Resizable panels: `ResizeHandle.tsx` (pointer-drag) on the sidebar, AI panel, and
  split-notes; widths in `store` (`sidebarWidth`/`aiPanelWidth`/`notesWidth`, persisted).
- Edit-request inbox (`RequestsPanel.tsx`) categories: Pending / Requires review /
  Approved / Rejected / All. `RequestDetail.tsx` actions are Accept→approved,
  Reject→rejected, Modify→needs_review. `TaskStatus` + `isTaskOpen` in lib/types.

## Governance: simulated locally, not enforced
Identity/roles, edit-requests, and version authorship run against a local
`SEED_USERS` registry — a prototype for real auth. Treat as UX scaffolding, not
security. The following from the governance spec are NOT built yet and largely
need the backend: 8-digit file access codes + 3-attempt lockout + host
notifications, push-based file sharing, block/revoke access, publishing approval
workflow, workbook (.efw) export/import with import codes + metadata, AI email
drafting, folder-level ZIP download, real end-to-end `.ef` encryption + atomic
saves / conflict resolution, shape annotation tools (freehand drawing/doodle now
built — see `Drawing` extension), inline comment-anywhere boxes, a full CRDT "Protected View" node-ID task-binding
layer (current annotation marks already move with content and survive undo, which
covers the practical need), and realtime collaboration markers (live cursors/avatars).

## Not yet built (services phase — needs a backend)
Live collaboration (Yjs/Hocuspocus CRDT + WebSockets), host-controlled change queues,
append-only audit log, comments/@mentions, **enforced** RBAC (current is client-side
only), Google OAuth login + AI tied to identity, real cross-device shareable links,
real `.ef` encryption + CDN image storage, server-side export pipeline, publishing
exports, the collaboration analytics dashboard (folders/users accessed, activity
logs), and wiring the AI suite to the Claude API. Image storage is currently inline
base64; embeds generate previews from the URL only (no metadata scraping yet).

## Document storage (Supabase — scaffolded, inert until configured)
- `lib/supabase.ts` — browser client from `NEXT_PUBLIC_SUPABASE_URL` + `…_ANON_KEY`
  (+ optional `…_DOCS_BUCKET`, default `documents`). `supabaseEnabled` is false and
  `getSupabase()` returns null until keys exist, so the app stays on local `persist`
  storage in the meantime (same pattern as Clerk's `clerkEnabled`).
- `lib/docStorage.ts` — per-user document objects at `<userId>/<docId>.json` in the
  Storage bucket: `saveDocumentToCloud` / `loadDocumentFromCloud` / `listCloudDocuments` /
  `deleteDocumentFromCloud`. All no-op gracefully when unconfigured.
- **Wired**: `components/CloudSync.tsx` (rendered in `Workspace` only when
  `cloudReady` = Supabase + Clerk both configured) uses the Clerk `useAuth()` user id to
  pull the user's docs on load (`mergeCloudDocs`) and debounce-push the active doc on
  change. `store.cloudStatus`/`cloudError`/`lastCloudSyncAt` drive the TopBar
  `CloudIndicator`. Deletion sync (remove from bucket on permanent delete) is the next
  step. Still TODO in the Supabase dashboard: create the `documents` bucket + an RLS
  policy isolating by the `<userId>/` path prefix (Clerk-issued Supabase JWT).

## Run
`npm run dev` (port 3000) · `npm run build` · `npm run lint`
