"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pen, Pencil, Eraser, Undo2, Trash2, X, GripVertical, Square, Circle, Triangle, ArrowUpRight, Minus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { PageStroke } from "@/lib/types";

type Shape = "rect" | "circle" | "triangle" | "arrow" | "line";
type Tool = "pen" | "pencil" | "eraser" | Shape;
const SHAPE_TOOLS: Shape[] = ["rect", "circle", "triangle", "arrow", "line"];
const isShapeTool = (t: Tool): t is Shape => (SHAPE_TOOLS as string[]).includes(t);

const COLORS = ["#ef9f27", "#e24b4a", "#5dca8f", "#5b9ddd", "#7f77dd", "#d4537e", "#16161a", "#f4f4f5"];
const WIDTHS = [2, 4, 7];

function toPath(points: [number, number][]): string {
  if (!points.length) return "";
  if (points.length < 3) return points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  return d;
}

function Stroke({ s, scaleX }: { s: PageStroke; scaleX: number }) {
  const pts: [number, number][] = scaleX === 1 ? s.points : s.points.map(([x, y]) => [x * scaleX, y]);
  // Geometric shape — drawn from points[0] → points[last].
  if (s.shape && pts.length >= 2) {
    const [x1, y1] = pts[0];
    const [x2, y2] = pts[pts.length - 1];
    const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
    const common = { fill: "none", stroke: s.color, strokeWidth: s.width, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
    if (s.shape === "rect") return <rect x={x} y={y} width={w} height={h} rx={Math.min(6, w / 8, h / 8)} {...common} />;
    if (s.shape === "circle") return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />;
    if (s.shape === "triangle") return <polygon points={`${x + w / 2},${y} ${x},${y + h} ${x + w},${y + h}`} {...common} />;
    if (s.shape === "line") return <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} />;
    // arrow = line + arrowhead at the end
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ah = 8 + s.width * 2;
    const a1x = x2 - ah * Math.cos(ang - Math.PI / 7), a1y = y2 - ah * Math.sin(ang - Math.PI / 7);
    const a2x = x2 - ah * Math.cos(ang + Math.PI / 7), a2y = y2 - ah * Math.sin(ang + Math.PI / 7);
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} />
        <polyline points={`${a1x},${a1y} ${x2},${y2} ${a2x},${a2y}`} {...common} />
      </g>
    );
  }
  const d = toPath(pts);
  if (s.tool === "pencil") {
    return (
      <g style={{ mixBlendMode: "multiply" }}>
        <path d={d} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} filter="url(#pencil-grain)" />
        <path d={d} fill="none" stroke={s.color} strokeWidth={s.width * 0.7} strokeLinecap="round" strokeLinejoin="round" opacity={0.32} filter="url(#pencil-grain)" />
      </g>
    );
  }
  return <path d={d} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" opacity={0.96} />;
}

export function DoodleOverlay() {
  const doodleMode = useStore((s) => s.doodleMode);
  const toggle = useStore((s) => s.toggleDoodleMode);
  const strokes = useStore((s) => s.pageDoodles);
  const zoom = useStore((s) => s.zoom);
  const add = useStore((s) => s.addPageDoodle);
  const undo = useStore((s) => s.undoPageDoodle);
  const clear = useStore((s) => s.clearPageDoodles);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const drawing = useRef(false);
  const liveRef = useRef<PageStroke | null>(null);
  const [live, setLive] = useState<PageStroke | null>(null);

  // The editor scroll container is the doodle "canvas" — strokes are stored in
  // its content coordinates so they stay glued to the text and scroll with it.
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [, forceTick] = useState(0);

  // Moveable toolbar position.
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const dragTb = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const el = document.querySelector("[data-doodle-scope]") as HTMLElement | null;
    setScroller(el);
  }, [doodleMode, strokes.length]);

  // Keep the SVG sized to the full scrollable content and re-render on scroll.
  useEffect(() => {
    if (!scroller) return;
    const measure = () => setDims({ w: scroller.clientWidth, h: scroller.scrollHeight });
    const onScroll = () => forceTick((t) => t + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroller);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [scroller, strokes.length]);

  const toContent = useCallback(
    (e: React.PointerEvent): [number, number] => {
      if (!scroller) return [0, 0];
      const r = scroller.getBoundingClientRect();
      // The scope carries CSS `zoom`, so getBoundingClientRect returns scaled
      // px — divide by zoom to store strokes in unscaled content coordinates.
      return [Math.round((e.clientX - r.left) / zoom + scroller.scrollLeft), Math.round((e.clientY - r.top) / zoom + scroller.scrollTop)];
    },
    [scroller, zoom],
  );

  const eraseAt = useCallback(
    (p: [number, number]) => {
      const hit = strokes.findIndex((s) => s.points.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) <= s.width + 9));
      if (hit !== -1) {
        const next = strokes.filter((_, i) => i !== hit);
        clear();
        next.forEach(add);
      }
    },
    [strokes, add, clear],
  );

  if (!doodleMode && strokes.length === 0) return null;

  const onDown = (e: React.PointerEvent) => {
    if (!doodleMode) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const p = toContent(e);
    if (tool === "eraser") { eraseAt(p); return; }
    const s: PageStroke = isShapeTool(tool)
      ? { tool: "pen", color, width, points: [p, p], cw: scroller?.clientWidth || undefined, shape: tool }
      : { tool: tool as "pen" | "pencil", color, width, points: [p], cw: scroller?.clientWidth || undefined };
    liveRef.current = s;
    setLive(s);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!doodleMode || !drawing.current) return;
    const p = toContent(e);
    if (tool === "eraser") { eraseAt(p); return; }
    if (!liveRef.current) return;
    // Shapes track only start→current; freehand appends.
    const s = isShapeTool(tool)
      ? { ...liveRef.current, points: [liveRef.current.points[0], p] as [number, number][] }
      : { ...liveRef.current, points: [...liveRef.current.points, p] };
    liveRef.current = s;
    setLive(s);
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const s = liveRef.current;
    if (s && s.points.length) add(s);
    liveRef.current = null;
    setLive(null);
  };

  const all = live ? [...strokes, live] : strokes;

  // Toolbar drag handlers.
  const onTbDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragTb.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onTbMove = (e: React.PointerEvent) => {
    if (!dragTb.current) return;
    setToolbarPos({ x: e.clientX - dragTb.current.dx, y: e.clientY - dragTb.current.dy });
  };
  const onTbUp = () => { dragTb.current = null; };

  const svgLayer =
    scroller &&
    createPortal(
      <svg
        width={dims.w}
        height={dims.h}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          // Drawing captures pointers only in doodle mode; wheel still scrolls
          // the container (we never preventDefault wheel), so you can scroll
          // and doodle on text further down the page.
          pointerEvents: doodleMode ? "auto" : "none",
          cursor: doodleMode ? (tool === "eraser" ? "cell" : "crosshair") : "default",
          touchAction: "pan-y",
          zIndex: 5,
        }}
      >
        <defs>
          <filter id="pencil-grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {all.map((s, i) => (
          <Stroke key={i} s={s} scaleX={s.cw && dims.w ? dims.w / s.cw : 1} />
        ))}
      </svg>,
      scroller,
    );

  return (
    <>
      {svgLayer}

      {doodleMode && (
        <div
          style={{
            position: "fixed",
            ...(toolbarPos ? { left: toolbarPos.x, top: toolbarPos.y } : { bottom: 24, left: "50%", transform: "translateX(-50%)" }),
            zIndex: 61,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 12,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          <span
            onPointerDown={onTbDown}
            onPointerMove={onTbMove}
            onPointerUp={onTbUp}
            title="Drag to move toolbar"
            style={{ display: "flex", alignItems: "center", color: "var(--text-tertiary)", cursor: "grab", touchAction: "none" }}
          >
            <GripVertical size={16} />
          </span>
          <ToolBtn icon={Pen} label="Pen (ink)" active={tool === "pen"} onClick={() => setTool("pen")} />
          <ToolBtn icon={Pencil} label="Pencil (sketch)" active={tool === "pencil"} onClick={() => setTool("pencil")} />
          <ToolBtn icon={Eraser} label="Eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          {/* Shapes — drag to size; use the palette to color them. */}
          <ToolBtn icon={Square} label="Rectangle" active={tool === "rect"} onClick={() => setTool("rect")} />
          <ToolBtn icon={Circle} label="Circle / ellipse" active={tool === "circle"} onClick={() => setTool("circle")} />
          <ToolBtn icon={Triangle} label="Triangle" active={tool === "triangle"} onClick={() => setTool("triangle")} />
          <ToolBtn icon={ArrowUpRight} label="Arrow" active={tool === "arrow"} onClick={() => setTool("arrow")} />
          <ToolBtn icon={Minus} label="Line" active={tool === "line"} onClick={() => setTool("line")} />
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          <div style={{ display: "flex", gap: 5 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onMouseDown={(e) => { e.preventDefault(); setColor(c); if (tool === "eraser") setTool("pen"); }}
                style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: color === c && tool !== "eraser" ? "2px solid var(--accent)" : "1px solid var(--border-strong)" }}
              />
            ))}
            <label title="Custom color" style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border-strong)", cursor: "pointer", background: "conic-gradient(from 0deg,#ef4444,#eab308,#22c55e,#3b82f6,#8b5cf6,#ec4899,#ef4444)" }}>
              <input type="color" value={color} onChange={(e) => { setColor(e.target.value); if (tool === "eraser") setTool("pen"); }} style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
            </label>
          </div>
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          {WIDTHS.map((w) => (
            <button
              key={w}
              title={`${w}px`}
              onMouseDown={(e) => { e.preventDefault(); setWidth(w); }}
              style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: width === w ? "var(--accent-soft)" : "transparent" }}
            >
              <span style={{ width: w + 4, height: w + 4, borderRadius: "50%", background: "var(--text-secondary)" }} />
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          <ToolBtn icon={Undo2} label="Undo" onClick={undo} />
          <ToolBtn icon={Trash2} label="Clear all" onClick={clear} />
          <button
            onMouseDown={(e) => { e.preventDefault(); toggle(); }}
            style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4, padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 500, background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            <X size={14} /> Done
          </button>
        </div>
      )}
    </>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }: { icon: typeof Pen; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        color: active ? "var(--accent)" : "var(--text-secondary)",
        background: active ? "var(--accent-soft)" : "transparent",
      }}
    >
      <Icon size={17} />
    </button>
  );
}
