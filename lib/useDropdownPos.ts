"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export interface DropdownPos {
  left: number;
  top: number;
  maxHeight: number;
}

/** Position a dropdown as fixed, anchored under an element, clamped into the
 *  viewport and re-clamped on resize/scroll — so menus never clip or overlap
 *  off-screen when the page is resized. */
export function useDropdownPos(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  width: number,
): DropdownPos | null {
  const [pos, setPos] = useState<DropdownPos | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
      const top = Math.min(r.bottom + 6, window.innerHeight - 60);
      setPos({ left, top, maxHeight: Math.max(160, window.innerHeight - top - 12) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, width]);

  return pos;
}
