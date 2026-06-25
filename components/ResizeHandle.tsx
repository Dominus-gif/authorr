"use client";

import { useState } from "react";

interface Props {
  side: "left" | "right";
  width: number;
  min: number;
  max: number;
  onChange: (w: number) => void;
}

/** Thin draggable divider for resizing an adjacent panel. */
export function ResizeHandle({ side, width, min, max, onChange }: Props) {
  const [active, setActive] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    setActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const raw = side === "right" ? startW + dx : startW - dx;
      onChange(Math.max(min, Math.min(max, Math.round(raw))));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setActive(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: -3,
        width: 6,
        cursor: "col-resize",
        zIndex: 25,
        background: active ? "var(--accent)" : "transparent",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => !active && (e.currentTarget.style.background = "var(--border-strong)")}
      onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
    />
  );
}
