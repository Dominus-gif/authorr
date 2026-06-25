"use client";

import { useRef, useState, useCallback } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Undo2, Trash2, X, Pencil, Eraser } from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    drawing: {
      /** Insert an empty freehand doodle canvas. */
      insertDrawing: () => ReturnType;
    };
  }
}

type Point = [number, number];
interface Stroke {
  color: string;
  width: number;
  points: Point[];
}
type Align = "left" | "center" | "right";
interface DrawingAttrs {
  strokes: Stroke[];
  w: number;
  h: number;
  align: Align;
}

const PEN_COLORS = ["#ef9f27", "#e24b4a", "#5dca8f", "#5b9ddd", "#7f77dd", "#d4537e", "#f4f4f5", "#16161a"];
const PEN_WIDTHS = [2, 4, 8];

/** SVG path data for one stroke — a smooth polyline (round caps/joins). */
function toPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x} ${y} L ${x + 0.1} ${y}`;
  }
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

function alignToMargin(align: Align): string {
  if (align === "left") return "0 auto 0 0";
  if (align === "right") return "0 0 0 auto";
  return "0 auto";
}

function DrawingView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { strokes, w, h, align } = node.attrs as DrawingAttrs;
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(PEN_WIDTHS[1]);
  const [erase, setErase] = useState(false);
  // In-progress stroke: a ref is the source of truth (so commit-on-up never
  // reads a stale closure), mirrored into state purely to drive live render.
  const liveRef = useRef<Stroke | null>(null);
  const [live, setLive] = useState<Stroke | null>(null);
  const editable = editor.isEditable;

  const relPoint = useCallback((e: React.PointerEvent): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    return [
      Math.round(Math.max(0, Math.min(w, e.clientX - r.left))),
      Math.round(Math.max(0, Math.min(h, e.clientY - r.top))),
    ];
  }, [w, h]);

  const eraseAt = useCallback((p: Point) => {
    const hit = (s: Stroke) =>
      s.points.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) <= s.width + 7);
    const next = strokes.filter((s) => !hit(s));
    if (next.length !== strokes.length) updateAttributes({ strokes: next });
  }, [strokes, updateAttributes]);

  const onDown = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* synthetic events */ }
    drawing.current = true;
    const p = relPoint(e);
    if (erase) { eraseAt(p); return; }
    const s = { color, width, points: [p] };
    liveRef.current = s;
    setLive(s);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!editable || !drawing.current) return;
    const p = relPoint(e);
    if (erase) { eraseAt(p); return; }
    if (!liveRef.current) return;
    const s = { ...liveRef.current, points: [...liveRef.current.points, p] };
    liveRef.current = s;
    setLive(s);
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const s = liveRef.current;
    if (s && s.points.length > 0) updateAttributes({ strokes: [...strokes, s] });
    liveRef.current = null;
    setLive(null);
  };

  const undo = () => updateAttributes({ strokes: strokes.slice(0, -1) });
  const clear = () => updateAttributes({ strokes: [] });
  const setAlign = (a: Align) => updateAttributes({ align: a });

  const allStrokes = live ? [...strokes, live] : strokes;

  return (
    <NodeViewWrapper
      as="div"
      data-drawing-wrap=""
      style={{ margin: "1.2em 0", display: "flex", justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}
    >
      <div style={{ width: w, maxWidth: "100%" }}>
        {editable && (
          <div
            contentEditable={false}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px",
              borderRadius: "9px 9px 0 0",
              background: "var(--bg-elev-2)",
              border: "1px solid var(--border-strong)",
              borderBottom: "none",
              flexWrap: "wrap",
            }}
          >
            <Pencil size={13} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginRight: 2 }}>Doodle</span>
            <div style={{ display: "flex", gap: 4 }}>
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  title={`Pen ${c}`}
                  onMouseDown={(e) => { e.preventDefault(); setColor(c); setErase(false); }}
                  style={{
                    width: 16, height: 16, borderRadius: "50%", background: c,
                    border: color === c && !erase ? "2px solid var(--accent)" : "1px solid var(--border-strong)",
                  }}
                />
              ))}
            </div>
            <span style={{ width: 1, height: 16, background: "var(--border)" }} />
            {PEN_WIDTHS.map((pw) => (
              <button
                key={pw}
                title={`${pw}px`}
                onMouseDown={(e) => { e.preventDefault(); setWidth(pw); setErase(false); }}
                style={{
                  width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  background: width === pw && !erase ? "var(--accent-soft)" : "transparent",
                }}
              >
                <span style={{ width: pw + 4, height: pw + 4, borderRadius: "50%", background: "var(--text-secondary)" }} />
              </button>
            ))}
            <span style={{ width: 1, height: 16, background: "var(--border)" }} />
            <ToolBtn icon={Eraser} label="Erase strokes" active={erase} onClick={() => setErase((v) => !v)} />
            <ToolBtn icon={Undo2} label="Undo stroke" onClick={undo} />
            <ToolBtn icon={Trash2} label="Clear doodle" onClick={clear} />
            <span style={{ flex: 1 }} />
            <span style={{ display: "flex", gap: 2 }}>
              {(["left", "center", "right"] as Align[]).map((a) => (
                <button
                  key={a}
                  title={`Align ${a}`}
                  onMouseDown={(e) => { e.preventDefault(); setAlign(a); }}
                  style={{
                    fontSize: 10, padding: "3px 6px", borderRadius: 5, textTransform: "capitalize",
                    color: align === a ? "var(--accent)" : "var(--text-tertiary)",
                    background: align === a ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  {a[0].toUpperCase()}
                </button>
              ))}
            </span>
            <ToolBtn icon={X} label="Remove doodle" onClick={() => deleteNode()} />
          </div>
        )}
        <svg
          ref={svgRef}
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            aspectRatio: `${w} / ${h}`,
            background: "var(--bg-elev)",
            borderRadius: editable ? "0 0 9px 9px" : 9,
            border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border-strong)",
            margin: editable ? 0 : alignToMargin(align),
            touchAction: "none",
            cursor: editable ? (erase ? "cell" : "crosshair") : "default",
          }}
        >
          {allStrokes.map((s, i) => (
            <path
              key={i}
              d={toPath(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
    </NodeViewWrapper>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }: { icon: typeof Undo2; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        background: active ? "var(--accent-soft)" : "transparent",
      }}
    >
      <Icon size={14} />
    </button>
  );
}

export const Drawing = Node.create({
  name: "drawing",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      strokes: {
        default: [] as Stroke[],
        parseHTML: (el: HTMLElement) => {
          try { return JSON.parse(el.getAttribute("data-strokes") || "[]"); }
          catch { return []; }
        },
        renderHTML: (attrs: { strokes?: Stroke[] }) => ({
          "data-strokes": JSON.stringify(attrs.strokes ?? []),
        }),
      },
      w: { default: 680 },
      h: { default: 240 },
      align: { default: "center" as Align },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-drawing]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { strokes, w, h, align } = node.attrs as DrawingAttrs;
    // Inline the doodle as an SVG data-URI <img> so it survives export/print
    // and .ef round-trips; data-strokes lets the editor rebuild it on reload
    // (ProseMirror's serializer can't emit live SVG namespaces, hence the img).
    const paths = (strokes ?? [])
      .map(
        (s) =>
          `<path d="${toPath(s.points)}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`,
      )
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${paths}</svg>`;
    const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-drawing": "",
        style: `margin:1.2em 0;text-align:${align}`,
      }),
      [
        "img",
        {
          src,
          alt: "Doodle",
          style: `max-width:100%;width:${w}px;height:auto;border:1px solid #d8d8de;border-radius:9px;background:#fff;display:inline-block;margin:${alignToMargin(align)}`,
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingView);
  },

  addCommands() {
    return {
      insertDrawing:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { strokes: [] } }).focus().run(),
    };
  },
});
