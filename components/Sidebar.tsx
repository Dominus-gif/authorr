"use client";

import { useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  PenLine,
  Palette,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_META, NODE_COLORS, type TreeNode } from "@/lib/types";
import { ResizeHandle } from "./ResizeHandle";
import { SidebarFooter } from "./SidebarFooter";
import { LayoutControls } from "./LayoutControls";

function nodeColorValue(node: TreeNode): string | null {
  if (!node.color || node.color === "none") return null;
  return NODE_COLORS.find((c) => c.id === node.color)?.value ?? null;
}

function StatusDot({ node }: { node: TreeNode }) {
  if (node.type !== "doc" || !node.status) return null;
  const meta = STATUS_META[node.status];
  return (
    <span
      title={meta.label}
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: meta.color,
        flexShrink: 0,
      }}
    />
  );
}

function Row({ node, depth }: { node: TreeNode; depth: number }) {
  const {
    activeDocId,
    setActiveDoc,
    toggleFolder,
    renameNode,
    deleteNode,
    addDoc,
    setNodeColor,
  } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [palette, setPalette] = useState(false);

  const isActive = node.type === "doc" && node.id === activeDocId;
  const pad = 8 + depth * 14;
  const colorVal = nodeColorValue(node);

  const commitRename = () => {
    const v = draft.trim();
    if (v) renameNode(node.id, v);
    else setDraft(node.name);
    setEditing(false);
  };

  return (
    <>
      <div
        className="group"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 8px 5px " + pad + "px",
          margin: "1px 6px",
          borderRadius: 7,
          cursor: "pointer",
          fontSize: 13,
          color: isActive ? "var(--text)" : "var(--text-secondary)",
          background: isActive ? "var(--bg-elev-3)" : "transparent",
        }}
        onClick={() =>
          node.type === "folder" ? toggleFolder(node.id) : setActiveDoc(node.id)
        }
        onMouseEnter={(e) =>
          !isActive &&
          (e.currentTarget.style.background = "var(--bg-elev-2)")
        }
        onMouseLeave={(e) =>
          !isActive && (e.currentTarget.style.background = "transparent")
        }
      >
        {node.type === "folder" ? (
          <ChevronRight
            size={14}
            style={{
              flexShrink: 0,
              transition: "transform 0.15s",
              transform: node.expanded ? "rotate(90deg)" : "none",
              color: "var(--text-tertiary)",
            }}
          />
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}

        {node.type === "folder" ? (
          node.expanded ? (
            <FolderOpen size={15} style={{ flexShrink: 0, color: colorVal ?? "var(--text-tertiary)" }} />
          ) : (
            <Folder size={15} style={{ flexShrink: 0, color: colorVal ?? "var(--text-tertiary)" }} />
          )
        ) : (
          <FileText size={15} style={{ flexShrink: 0, color: colorVal ?? (isActive ? "var(--accent)" : "var(--text-tertiary)") }} />
        )}

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraft(node.name);
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: "var(--bg)",
              border: "1px solid var(--accent)",
              borderRadius: 5,
              color: "var(--text)",
              fontSize: 13,
              padding: "1px 5px",
              outline: "none",
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: isActive ? 500 : 400,
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setDraft(node.name);
              setEditing(true);
            }}
          >
            {node.name}
          </span>
        )}

        <StatusDot node={node} />

        <span
          className="opacity-0 group-hover:opacity-100"
          style={{ display: "flex", gap: 2, transition: "opacity 0.12s" }}
          onClick={(e) => e.stopPropagation()}
        >
          {node.type === "folder" && (
            <button
              title="New document"
              onClick={() => addDoc(node.id)}
              style={iconBtn}
            >
              <Plus size={13} />
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              title="Color label"
              onClick={() => setPalette((p) => !p)}
              style={iconBtn}
            >
              <Palette size={13} />
            </button>
            {palette && (
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  right: 0,
                  zIndex: 70,
                  display: "flex",
                  gap: 5,
                  padding: 7,
                  background: "var(--bg-elev-3)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 9,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.34)",
                }}
                onMouseLeave={() => setPalette(false)}
              >
                {NODE_COLORS.map((col) => (
                  <button
                    key={col.id}
                    title={col.label}
                    onClick={() => {
                      setNodeColor(node.id, col.id);
                      setPalette(false);
                    }}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: col.id === "none" ? "transparent" : col.value,
                      border:
                        col.id === "none"
                          ? "1.5px dashed var(--text-tertiary)"
                          : node.color === col.id
                            ? "2px solid var(--text)"
                            : "1px solid var(--border-strong)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            title="Rename"
            onClick={() => {
              setDraft(node.name);
              setEditing(true);
            }}
            style={iconBtn}
          >
            <PenLine size={13} />
          </button>
          <button
            title="Delete"
            onClick={() => deleteNode(node.id)}
            style={iconBtn}
          >
            <Trash2 size={13} />
          </button>
        </span>
      </div>

      {node.type === "folder" &&
        node.expanded &&
        node.children?.map((child) => (
          <Row key={child.id} node={child} depth={depth + 1} />
        ))}
    </>
  );
}

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  borderRadius: 5,
  color: "var(--text-tertiary)",
};

const WORKSPACES: { id: "personal" | "team"; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "team", label: "Team" },
];

export function Sidebar() {
  const { tree, addDoc, addFolder } = useStore();
  const sidebarWidth = useStore((s) => s.sidebarWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const workspace = useStore((s) => s.sidebarWorkspace);
  const setWorkspace = useStore((s) => s.setSidebarWorkspace);
  const isFree = useStore((s) => s.plan === "free");
  const requireFeature = useStore((s) => s.requireFeature);
  // Documents are separated into Personal vs Team by their collabMode.
  const roots = tree.filter((n) => (n.collabMode ?? "personal") === workspace);

  return (
    <aside
      className="app-sidebar"
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        height: "100%",
        position: "relative",
        background: "var(--bg-elev)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ResizeHandle side="right" width={sidebarWidth} min={200} max={420} onChange={(w) => setPanelWidth("sidebar", w)} />
      {/* Workspace switcher */}
      <div
        style={{
          padding: "12px 12px 10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {WORKSPACES.map((w) => {
            const active = workspace === w.id;
            const locked = isFree && w.id === "team";
            return (
              <button
                key={w.id}
                onClick={() => {
                  if (locked) { requireFeature("collaboration"); return; }
                  setWorkspace(w.id);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontSize: 12,
                  padding: "5px 0",
                  borderRadius: 7,
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
                  background: active ? "var(--accent)" : "transparent",
                  opacity: locked ? 0.7 : 1,
                }}
              >
                {locked && <Lock size={11} />}
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 4px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          {workspace}
        </span>
        <span style={{ display: "flex", gap: 2 }}>
          <button title="New document" onClick={() => addDoc(null)} style={iconBtn}>
            <Plus size={15} />
          </button>
          <button title="New folder" onClick={() => addFolder(null)} style={iconBtn}>
            <FolderPlus size={15} />
          </button>
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
        {roots.map((node) => (
          <Row key={node.id} node={node} depth={0} />
        ))}
        {roots.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "10px 16px", lineHeight: 1.5 }}>
            No {workspace} documents yet. Use + to create one here.
          </p>
        )}
      </div>

      <LayoutControls />
      <SidebarFooter />
    </aside>
  );
}
