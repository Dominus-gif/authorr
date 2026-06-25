"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDropdownPos } from "@/lib/useDropdownPos";
import {
  Download,
  FileText,
  FileType,
  FileCode,
  Hash,
  Shield,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useStore, selectActiveDoc } from "@/lib/store";
import { planAllows, type Feature } from "@/lib/plans";
import { useEditorInstance } from "./EditorContext";
import { fontStack } from "@/lib/fonts";
import { serializeEF } from "@/lib/efformat";
import {
  downloadText,
  downloadBlob,
  safeName,
  toMarkdown,
  exportPdf,
  exportDocx,
} from "@/lib/export";
import type { DocVersion } from "@/lib/types";

const EMPTY_VERSIONS: DocVersion[] = [];

function Item({
  icon: Icon,
  label,
  hint,
  onClick,
  locked,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 9px",
        borderRadius: 8,
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elev-3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
      <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{hint}</span>
      </span>
      {locked && <Lock size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />}
    </button>
  );
}

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pos = useDropdownPos(open, btnRef, 248);
  const editor = useEditorInstance();
  const doc = useStore(selectActiveDoc);
  const versions = useStore((s) => (doc ? s.versions[doc.id] ?? EMPTY_VERSIONS : EMPTY_VERSIONS));
  const font = useStore((s) => s.font);
  const plan = useStore((s) => s.plan);
  const requireFeature = useStore((s) => s.requireFeature);
  const paperTextures = useStore((s) => s.paperTextures);
  const grid = useStore((s) => s.grid);
  // Free downloads are limited to Text + Markdown.
  const efLocked = !planAllows(plan, "efExport");
  const pdfLocked = !planAllows(plan, "pdfExport");
  const docxLocked = !planAllows(plan, "docxExport");
  /** Gate a premium export: open the upgrade modal instead of running it. */
  const guard = (feature: Feature, fn: () => void) => () => {
    if (!requireFeature(feature)) { setOpen(false); return; }
    fn();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!doc) return null;
  const base = safeName(doc.name);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const onEf = () =>
    run(() => {
      if (!editor) return;
      const ef = serializeEF(doc, editor.getHTML(), editor.getJSON(), versions);
      downloadText(ef, `${base}.ef`, "application/octet-stream");
    });

  const onPdf = () =>
    run(() => {
      if (!editor) return;
      // Carry the document's paper texture into print so grids/lines stay visible.
      const tex = paperTextures[doc.id];
      const op = Math.round(grid.opacity * 100);
      const base = grid.color ?? "#8a93a6";
      const paper = tex && tex !== "plain"
        ? { texture: tex, cell: tex === "lines" ? 32 : grid.cellSize, dot: grid.dotDistance, color: `color-mix(in srgb, ${base} ${op}%, transparent)` }
        : undefined;
      exportPdf(doc.name, editor.getHTML(), fontStack(font), useStore.getState().pageSize, paper);
    });

  const onDocx = () =>
    run(async () => {
      if (!editor) return;
      const blob = await exportDocx(doc.name, editor.getJSON() as never);
      downloadBlob(blob, `${base}.docx`);
    });

  const onTxt = () =>
    run(() => editor && downloadText(editor.getText(), `${base}.txt`));

  const onMd = () =>
    run(() =>
      editor && downloadText(toMarkdown(editor.getJSON() as never), `${base}.md`, "text/markdown"),
    );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Download & export"
        aria-label="Download and export"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          color: open ? "var(--accent)" : "var(--text-secondary)",
          background: open ? "var(--accent-soft)" : "transparent",
        }}
        onMouseEnter={(e) => !open && (e.currentTarget.style.background = "var(--bg-elev-2)")}
        onMouseLeave={(e) => !open && (e.currentTarget.style.background = "transparent")}
      >
        <Download size={17} />
      </button>

      {open && pos && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 1000,
            width: 248,
            maxHeight: pos.maxHeight,
            overflowY: "auto",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 14px 36px rgba(0,0,0,0.34)",
          }}
        >
          <Item icon={Shield} label="Save as .ef" hint="Signed EasyFrame format" onClick={guard("efExport", onEf)} locked={efLocked} />
          <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />
          <Item icon={FileType} label="Export PDF" hint="Print-ready layout" onClick={guard("pdfExport", onPdf)} locked={pdfLocked} />
          <Item icon={FileText} label="Export Word" hint=".docx editable" onClick={guard("docxExport", onDocx)} locked={docxLocked} />
          <Item icon={Hash} label="Export Markdown" hint=".md plain markup" onClick={onMd} />
          <Item icon={FileCode} label="Export Text" hint=".txt lightweight" onClick={onTxt} />
        </div>,
        document.body,
      )}
    </div>
  );
}
