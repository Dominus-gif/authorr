import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/** "Select / move" tool (no handle/icon). While the editor wrapper carries
 *  `.move-mode`, pressing a top-level block and dragging *moves* it (a single
 *  delete+insert transaction — never a native HTML5 copy) to a drop position
 *  shown by a live indicator line. Auto-scrolls when the pointer nears an edge
 *  so you can drop far away. */
export const BlockMover = Extension.create({
  name: "blockMover",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockMover"),
        view: (view: EditorView) => {
          let dragging = false;
          let sourcePos: number | null = null;
          let sourceSize = 0;
          let targetInsert: number | null = null;
          let pointerY = 0;
          let raf = 0;
          let scroller: HTMLElement | null = null;
          let indicator: HTMLElement | null = null;

          const root = view.dom as HTMLElement;
          const inMove = () => !!root.closest(".move-mode");

          const findScroller = (el: HTMLElement | null): HTMLElement | null => {
            let n = el;
            while (n && n !== document.body) {
              const s = getComputedStyle(n);
              if ((s.overflowY === "auto" || s.overflowY === "scroll") && n.scrollHeight > n.clientHeight) return n;
              n = n.parentElement;
            }
            return null;
          };

          // Resolve the top-level block under a point + whether to drop after it.
          const blockAt = (x: number, y: number) => {
            let el = document.elementFromPoint(x, y) as HTMLElement | null;
            if (!el || !root.contains(el)) {
              // Fallback: nearest top-level child by vertical position.
              let best: HTMLElement | null = null;
              for (const k of Array.from(root.children) as HTMLElement[]) {
                if (y >= k.getBoundingClientRect().top - 4) best = k;
              }
              el = best;
            } else {
              while (el && el.parentElement !== root) el = el.parentElement;
            }
            if (!el || el.parentElement !== root) return null;
            const rect = el.getBoundingClientRect();
            const after = y > rect.top + rect.height / 2;
            try {
              const inside = view.posAtDOM(el, 0);
              const $pos = view.state.doc.resolve(inside);
              const start = $pos.depth >= 1 ? $pos.before(1) : inside;
              const node = view.state.doc.nodeAt(start);
              const insert = after && node ? start + node.nodeSize : start;
              return { el, rect, after, insert };
            } catch {
              return null;
            }
          };

          const showIndicator = (x: number, y: number) => {
            const t = blockAt(x, y);
            if (!t) {
              if (indicator) indicator.style.display = "none";
              targetInsert = null;
              return;
            }
            targetInsert = t.insert;
            if (!indicator) {
              indicator = document.createElement("div");
              indicator.className = "pm-drop-indicator";
              document.body.appendChild(indicator);
            }
            const yPos = t.after ? t.rect.bottom : t.rect.top;
            indicator.style.display = "block";
            indicator.style.left = `${t.rect.left}px`;
            indicator.style.top = `${yPos}px`;
            indicator.style.width = `${t.rect.width}px`;
          };

          const autoScroll = () => {
            if (!dragging) return;
            if (scroller) {
              const r = scroller.getBoundingClientRect();
              const EDGE = 64;
              const SPEED = 14;
              if (pointerY < r.top + EDGE) scroller.scrollTop -= SPEED;
              else if (pointerY > r.bottom - EDGE) scroller.scrollTop += SPEED;
            }
            raf = requestAnimationFrame(autoScroll);
          };

          const onPointerDown = (e: PointerEvent) => {
            if (!inMove() || e.button !== 0) return;
            const t = blockAt(e.clientX, e.clientY);
            if (!t) return;
            const inside = view.posAtDOM(t.el, 0);
            const $pos = view.state.doc.resolve(inside);
            const start = $pos.depth >= 1 ? $pos.before(1) : inside;
            const node = view.state.doc.nodeAt(start);
            if (!node) return;
            e.preventDefault();
            dragging = true;
            sourcePos = start;
            sourceSize = node.nodeSize;
            targetInsert = null;
            scroller = findScroller(root);
            pointerY = e.clientY;
            root.setPointerCapture?.(e.pointerId);
            root.classList.add("pm-moving");
            raf = requestAnimationFrame(autoScroll);
          };

          const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            pointerY = e.clientY;
            showIndicator(e.clientX, e.clientY);
          };

          const finish = () => {
            if (!dragging) return;
            dragging = false;
            cancelAnimationFrame(raf);
            root.classList.remove("pm-moving");
            if (indicator) indicator.style.display = "none";
            if (sourcePos != null && targetInsert != null) {
              const node = view.state.doc.nodeAt(sourcePos);
              const insert = targetInsert;
              // Skip a no-op drop (back into its own span).
              if (node && node.nodeSize === sourceSize && !(insert >= sourcePos && insert <= sourcePos + sourceSize)) {
                const tr = view.state.tr;
                tr.delete(sourcePos, sourcePos + sourceSize);
                tr.insert(tr.mapping.map(insert), node);
                view.dispatch(tr.scrollIntoView());
              }
            }
            sourcePos = null;
            targetInsert = null;
          };

          view.dom.addEventListener("pointerdown", onPointerDown);
          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", finish);
          window.addEventListener("pointercancel", finish);

          return {
            destroy() {
              view.dom.removeEventListener("pointerdown", onPointerDown);
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", finish);
              window.removeEventListener("pointercancel", finish);
              cancelAnimationFrame(raf);
              indicator?.remove();
            },
          };
        },
      }),
    ];
  },
});
