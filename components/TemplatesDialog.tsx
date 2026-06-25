"use client";

import { useMemo, useState } from "react";
import { LayoutTemplate, X, Search, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

export function TemplatesDialog() {
  const open = useStore((s) => s.templatesOpen);
  const setOpen = useStore((s) => s.setTemplatesOpen);
  const createFromTemplate = useStore((s) => s.createFromTemplate);
  const favorites = useStore((s) => s.favoriteTemplates);
  const toggleFavorite = useStore((s) => s.toggleFavoriteTemplate);
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const inCat = cat === "All" ? true : cat === "Favorites" ? favorites.includes(t.id) : t.category === cat;
      const inQuery = !ql || t.name.toLowerCase().includes(ql) || t.blurb.toLowerCase().includes(ql);
      return inCat && inQuery;
    });
  }, [cat, q, favorites]);

  if (!open) return null;

  const rail = ["All", "Favorites", ...TEMPLATE_CATEGORIES];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Templates"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1000px, 100%)", height: "min(720px, 92vh)", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <LayoutTemplate size={18} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Templates</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{TEMPLATES.length} professional, work-ready designs</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, background: "var(--bg-elev-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "5px 10px" }}>
            <Search size={14} style={{ color: "var(--text-tertiary)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" style={{ fontSize: 13, background: "transparent", color: "var(--text)", border: "none", outline: "none", width: 160 }} />
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ color: "var(--text-secondary)", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Category rail */}
          <div style={{ width: 190, flexShrink: 0, borderRight: "1px solid var(--border)", padding: 10, overflowY: "auto" }}>
            {rail.map((c) => {
              const active = cat === c;
              const isFav = c === "Favorites";
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", textAlign: "left", fontSize: 13, padding: "8px 11px", borderRadius: 9, marginBottom: 3, fontWeight: active ? 600 : 400, color: active ? "var(--accent)" : "var(--text-secondary)", background: active ? "var(--accent-soft)" : "transparent" }}
                >
                  {isFav && <Star size={13} style={{ fill: active ? "var(--accent)" : "none", color: active ? "var(--accent)" : "var(--text-tertiary)" }} />}
                  <span style={{ flex: 1 }}>{c}</span>
                  {isFav && favorites.length > 0 && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 999, padding: "0 6px" }}>{favorites.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16, alignContent: "start" }}>
            {shown.map((tpl) => {
              const fav = favorites.includes(tpl.id);
              return (
                <div
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => createFromTemplate(tpl.name, tpl.html)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); createFromTemplate(tpl.name, tpl.html); } }}
                  title={`Create a new "${tpl.name}" document`}
                  className="tpl-card"
                  style={{ textAlign: "left", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-strong)", background: "var(--bg-elev-2)", cursor: "pointer" }}
                >
                  {/* Rendered mini preview of the actual template document */}
                  <div style={{ position: "relative", height: 150, overflow: "hidden", background: "#ffffff", borderBottom: "1px solid var(--border)" }}>
                    <div
                      aria-hidden
                      className="tpl-thumb"
                      style={{ position: "absolute", top: 0, left: 0, width: 600, transform: "scale(0.35)", transformOrigin: "top left", padding: "26px 30px", pointerEvents: "none" }}
                      dangerouslySetInnerHTML={{ __html: tpl.html }}
                    />
                    {/* accent ribbon */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, background: tpl.accent }} />
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tpl.id); }}
                        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                        title={fav ? "Remove from favorites" : "Add to favorites"}
                        style={{ display: "flex", padding: 2, color: fav ? "#e8a33d" : "var(--text-tertiary)", flexShrink: 0 }}
                      >
                        <Star size={15} style={{ fill: fav ? "#e8a33d" : "none" }} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4, height: 30, overflow: "hidden", marginTop: 2 }}>{tpl.blurb}</div>
                    <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, color: tpl.accent, textTransform: "uppercase", letterSpacing: 0.4 }}>{tpl.category}</div>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", gridColumn: "1/-1", padding: 24, textAlign: "center" }}>
                {cat === "Favorites" ? "No favorites yet — tap the ☆ on any template to save it here." : `No templates match “${q}”.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
