"use client";

import { useState } from "react";
import { NotebookPen, Globe, Rows2 } from "lucide-react";
import { NotesPanel } from "./NotesPanel";
import { BrowserPane } from "./WebBrowser";

type Tab = "notes" | "browser" | "split";

/** The split-view side panel: Notes & Research and the mini web browser, in a
 *  tabbed layout — or a stacked split (notes on top, browser below). */
export function SidePanel() {
  const [tab, setTab] = useState<Tab>("notes");

  const TabBtn = ({ id, icon, label }: { id: Tab; icon: React.ReactNode; label: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 11px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          color: active ? "var(--accent)" : "var(--text-secondary)",
          background: active ? "var(--accent-soft)" : "transparent",
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
        <TabBtn id="notes" icon={<NotebookPen size={13} />} label="Notes" />
        <TabBtn id="browser" icon={<Globe size={13} />} label="Browser" />
        <TabBtn id="split" icon={<Rows2 size={13} />} label="Split" />
      </div>

      {tab === "notes" && <NotesPanel />}
      {tab === "browser" && <BrowserPane />}
      {tab === "split" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 12px 0" }}>Notes & research</div>
            <NotesPanel />
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 12px 0" }}>Web browser</div>
            <BrowserPane />
          </div>
        </div>
      )}
    </div>
  );
}
