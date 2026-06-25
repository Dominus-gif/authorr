import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PAGE_SIZES } from "./pageSizes";

/* ── generic download helpers ── */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

export function safeName(name: string): string {
  return (name || "document").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

/* ── ProseMirror JSON types (loose) ── */
interface PMMark {
  type: string;
  attrs?: Record<string, unknown>;
}
interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
}

/* ───────────────────────── Markdown ───────────────────────── */
function inlineMd(nodes: PMNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n";
      if (n.type === "image") {
        const a = n.attrs ?? {};
        return `![${a.alt ?? ""}](${a.src ?? ""})`;
      }
      if (n.type === "embed") {
        const a = n.attrs ?? {};
        return `[${a.title ?? a.href}](${a.href})`;
      }
      let t = n.text ?? "";
      if (!t) return "";
      for (const m of n.marks ?? []) {
        if (m.type === "bold") t = `**${t}**`;
        else if (m.type === "italic") t = `*${t}*`;
        else if (m.type === "strike") t = `~~${t}~~`;
        else if (m.type === "code") t = "`" + t + "`";
        else if (m.type === "link") t = `[${t}](${m.attrs?.href ?? ""})`;
      }
      return t;
    })
    .join("");
}

function blockMd(node: PMNode, depth = 0): string {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return `${"#".repeat(level)} ${inlineMd(node.content)}`;
    }
    case "paragraph":
      return inlineMd(node.content);
    case "blockquote":
      return (node.content ?? [])
        .map((c) => "> " + blockMd(c, depth))
        .join("\n");
    case "codeBlock":
      return "```" + (node.attrs?.language ?? "") + "\n" + inlineMd(node.content) + "\n```";
    case "horizontalRule":
      return "---";
    case "bulletList":
      return (node.content ?? [])
        .map((li) => `${"  ".repeat(depth)}- ${listItemMd(li, depth)}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => `${"  ".repeat(depth)}${i + 1}. ${listItemMd(li, depth)}`)
        .join("\n");
    case "image":
      return inlineMd([node]);
    case "embed":
      return inlineMd([node]);
    default:
      return inlineMd(node.content);
  }
}

function listItemMd(li: PMNode, depth: number): string {
  return (li.content ?? [])
    .map((c) =>
      c.type === "bulletList" || c.type === "orderedList"
        ? "\n" + blockMd(c, depth + 1)
        : blockMd(c, depth),
    )
    .join("");
}

export function toMarkdown(doc: PMNode): string {
  return (doc.content ?? [])
    .map((n) => blockMd(n))
    .filter((s) => s.length > 0)
    .join("\n\n");
}

/* ───────────────────────── PDF (print) ───────────────────────── */
/** Paper texture for print fidelity — grids/lines stay visible with their color. */
export interface PrintPaper {
  texture: "lines" | "dots" | "grid";
  cell: number;
  dot: number;
  color: string;
}
function paperBackgroundCss(p: PrintPaper): string {
  const c = p.color;
  if (p.texture === "lines")
    return `background-image: repeating-linear-gradient(to bottom, transparent 0, transparent ${p.cell - 1}px, ${c} ${p.cell - 1}px, ${c} ${p.cell}px);`;
  if (p.texture === "dots")
    return `background-image: radial-gradient(${c} 1.2px, transparent 1.5px); background-size: ${p.dot}px ${p.dot}px;`;
  return `background-image: linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px); background-size: ${p.cell}px ${p.cell}px;`;
}

export function exportPdf(title: string, bodyHtml: string, fontStack: string, pageSize: import("./pageSizes").PageSizeId = "letter", paper?: PrintPaper) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) {
    // Popup blocked — surface via the in-app toast instead of a native alert.
    import("./store").then((m) => m.useStore.getState().showToast("Allow pop-ups to export/print as PDF."));
    return;
  }
  const sizeCss = PAGE_SIZES[pageSize]?.css ?? "letter";
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&family=Hanken+Grotesk:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&family=Dancing+Script:wght@600;700&family=Caveat:wght@400;600;700&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Architects+Daughter&family=Shadows+Into+Light&family=Indie+Flower&family=Gochi+Hand&family=Comic+Neue:wght@300;400;700&family=Gloria+Hallelujah&display=swap">
<style>
  @page { size: ${sizeCss}; margin: 22mm 20mm; }
  hr[data-page-break] { border: none !important; height: 0 !important; break-after: page; page-break-after: always; margin: 0; }
  hr[data-page-break]::after { display: none !important; }
  p[data-sx="scene"] { text-transform: uppercase; font-weight: 700; }
  p[data-sx="character"] { text-transform: uppercase; margin-left: 38%; margin-bottom: 0; }
  p[data-sx="dialogue"] { margin-left: 18%; margin-right: 22%; }
  p[data-sx="transition"] { text-transform: uppercase; text-align: right; }
  /* Resolve the app's next/font CSS variables to real families so selected /
     custom fonts print correctly instead of falling back to defaults. */
  :root {
    --font-sans: 'Inter'; --font-serif: 'Source Serif 4'; --font-mono: 'JetBrains Mono';
    --font-roboto: 'Roboto'; --font-open-sans: 'Open Sans'; --font-source-sans: 'Source Sans 3';
    --font-ibm-plex: 'IBM Plex Sans'; --font-lora: 'Lora'; --font-merriweather: 'Merriweather';
    --font-playfair: 'Playfair Display'; --font-signature: 'Dancing Script';
    --font-hanken: 'Hanken Grotesk'; --font-onest: 'Onest'; --font-reading: var(--font-sans);
    --font-doodle: 'Caveat'; --font-kalam: 'Kalam'; --font-patrick-hand: 'Patrick Hand';
    --font-architects: 'Architects Daughter'; --font-shadows: 'Shadows Into Light';
    --font-indie: 'Indie Flower'; --font-gochi: 'Gochi Hand'; --font-comic-neue: 'Comic Neue';
    --font-gloria: 'Gloria Hallelujah';
  }
  * { box-sizing: border-box; }
  /* Preserve highlight/paint colors in print */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: ${fontStack}; color: #1a1a1f; line-height: 1.65; font-size: 12pt; max-width: none; margin: 0 auto; padding: 0; ${paper ? paperBackgroundCss(paper) : ""} }
  h1 { font-size: 24pt; margin: 0 0 8pt; }
  h2 { font-size: 18pt; margin: 18pt 0 6pt; }
  h3 { font-size: 14pt; margin: 14pt 0 6pt; }
  p { margin: 0 0 10pt; }
  blockquote { border-left: 3px solid #888; margin: 0 0 10pt; padding-left: 12pt; color: #444; font-style: italic; }
  pre { background: #f3f3f3; padding: 10pt; border-radius: 6px; overflow:auto; font-size: 10pt; }
  code { font-family: 'JetBrains Mono', monospace; background:#f3f3f3; padding:1px 4px; border-radius:3px; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  figure { margin: 0 0 10pt; }
  figcaption { font-size: 10pt; color:#666; text-align:center; margin-top:4pt; }
  hr { border:none; border-top:1px solid #ccc; margin: 16pt 0; }
  a { color: #4a40c4; }
  mark { padding: 0 1px; border-radius: 2px; }
  /* Tables — visible borders in print */
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; table-layout: fixed; }
  th, td { border: 1px solid #888; padding: 6pt 8pt; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; text-align: left; }
  /* Task lists */
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] li { display: flex; gap: 8px; align-items: flex-start; }
  /* Embeds & signatures keep their layout */
  div[data-embed] iframe { width: 100%; aspect-ratio: 16/9; border: 1px solid #ccc; border-radius: 8px; }
  div[data-signature] { break-inside: avoid; }
  span[data-annotation] { text-decoration: underline; }
</style></head><body>${bodyHtml}
<script>window.onload=function(){setTimeout(function(){window.print();},350);};<\/script>
</body></html>`);
  w.document.close();
}

/* ───────────────────────── DOCX ───────────────────────── */
function inlineRuns(nodes: PMNode[] = []): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  for (const n of nodes) {
    if (n.type === "hardBreak") {
      runs.push(new TextRun({ text: "", break: 1 }));
      continue;
    }
    if (!n.text) continue;
    const marks = n.marks ?? [];
    const has = (t: string) => marks.some((m) => m.type === t);
    const link = marks.find((m) => m.type === "link");
    const run = new TextRun({
      text: n.text,
      bold: has("bold"),
      italics: has("italic"),
      strike: has("strike"),
      font: has("code") ? "JetBrains Mono" : undefined,
      style: link ? "Hyperlink" : undefined,
    });
    if (link) {
      runs.push(
        new ExternalHyperlink({
          children: [run],
          link: String(link.attrs?.href ?? ""),
        }),
      );
    } else {
      runs.push(run);
    }
  }
  return runs;
}

function dataUrlToImage(src: string): { data: Uint8Array; type: "png" | "jpg" | "gif" } | null {
  const m = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  const type = ext === "png" ? "png" : ext === "gif" ? "gif" : "jpg";
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { data: bytes, type };
}

function blockParagraphs(node: PMNode): Paragraph[] {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const heading =
        level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      return [new Paragraph({ heading, children: inlineRuns(node.content) })];
    }
    case "paragraph": {
      const img = node.content?.find((c) => c.type === "image");
      if (img) {
        const decoded = dataUrlToImage(String(img.attrs?.src ?? ""));
        if (decoded) {
          return [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: decoded.data,
                  type: decoded.type,
                  transformation: { width: 480, height: 320 },
                }),
              ],
            }),
          ];
        }
      }
      return [new Paragraph({ children: inlineRuns(node.content) })];
    }
    case "blockquote":
      return (node.content ?? []).flatMap((c) =>
        blockParagraphs(c).map(
          () =>
            new Paragraph({
              indent: { left: 480 },
              children: inlineRuns(c.content),
              border: { left: { style: BorderStyle.SINGLE, size: 12, space: 12, color: "888888" } },
            }),
        ),
      );
    case "codeBlock":
      return [
        new Paragraph({
          shading: { fill: "F3F3F3" },
          children: [new TextRun({ text: node.content?.[0]?.text ?? "", font: "JetBrains Mono", size: 20 })],
        }),
      ];
    case "horizontalRule":
      return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "CCCCCC" } }, children: [] })];
    case "bulletList":
      return (node.content ?? []).flatMap((li) =>
        (li.content ?? []).map(
          (p) => new Paragraph({ bullet: { level: 0 }, children: inlineRuns(p.content) }),
        ),
      );
    case "orderedList":
      return (node.content ?? []).flatMap((li) =>
        (li.content ?? []).map(
          (p) => new Paragraph({ numbering: { reference: "ef-ol", level: 0 }, children: inlineRuns(p.content) }),
        ),
      );
    case "image": {
      const decoded = dataUrlToImage(String(node.attrs?.src ?? ""));
      if (decoded)
        return [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: decoded.data, type: decoded.type, transformation: { width: 480, height: 320 } })],
          }),
        ];
      return [];
    }
    default:
      return [new Paragraph({ children: inlineRuns(node.content) })];
  }
}

export async function exportDocx(title: string, doc: PMNode): Promise<Blob> {
  const children = (doc.content ?? []).flatMap((n) => blockParagraphs(n));
  const document = new Document({
    numbering: {
      config: [
        {
          reference: "ef-ol",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [{ properties: {}, children: children.length ? children : [new Paragraph({ text: title })] }],
  });
  return Packer.toBlob(document);
}
