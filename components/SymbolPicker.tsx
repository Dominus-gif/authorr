"use client";

import { useState } from "react";
import { X, Sigma, Type } from "lucide-react";
import katex from "katex";
import { useStore } from "@/lib/store";
import { useEditorInstance } from "./EditorContext";

const CATEGORIES: { label: string; chars: string[] }[] = [
  { label: "Math", chars: ["±", "×", "÷", "≠", "≈", "≡", "≤", "≥", "∞", "∑", "∏", "√", "∂", "∫", "∇", "∝", "∈", "∉", "⊂", "⊆", "∪", "∩", "∅", "∀", "∃", "→", "⇒", "⇔", "·", "∘", "°", "‰", "ℝ", "ℕ", "ℤ", "ℚ", "ℂ"] },
  { label: "Greek", chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "χ", "ψ", "ω", "Γ", "Δ", "Θ", "Λ", "Ξ", "Π", "Σ", "Φ", "Ψ", "Ω"] },
  { label: "Arrows", chars: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↦", "↩", "↪", "⟶", "⟸", "⤴", "⤵", "↻", "↺"] },
  { label: "Currency", chars: ["$", "€", "£", "¥", "₹", "₩", "₽", "¢", "₿", "₪", "₺", "₴"] },
  { label: "Symbols", chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "‣", "★", "☆", "♥", "♦", "♠", "♣", "✓", "✗", "→", "…", "—", "–", "«", "»", "“", "”", "‘", "’"] },
  { label: "Fractions", chars: ["½", "⅓", "⅔", "¼", "¾", "⅕", "⅖", "⅗", "⅘", "⅙", "⅛", "⅜", "⅝", "⅞", "²", "³", "ⁿ", "₀", "₁", "₂", "ₙ"] },
];

const EQUATION_PRESETS: { label: string; latex: string }[] = [
  { label: "Fraction", latex: "\\frac{a}{b}" },
  { label: "Power", latex: "x^{2}" },
  { label: "Root", latex: "\\sqrt{x}" },
  { label: "Sum", latex: "\\sum_{i=1}^{n} i" },
  { label: "Integral", latex: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Quadratic", latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}" },
  { label: "Matrix", latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
  { label: "Limit", latex: "\\lim_{x \\to \\infty} f(x)" },
];

export function SymbolPicker() {
  const open = useStore((s) => s.symbolPickerOpen);
  const setOpen = useStore((s) => s.setSymbolPickerOpen);
  const editor = useEditorInstance();
  const [tab, setTab] = useState<"chars" | "equation">("chars");
  const [cat, setCat] = useState(0);
  const [latex, setLatex] = useState("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");

  if (!open) return null;

  const insertChar = (ch: string) => {
    editor?.chain().focus().insertContent(ch).run();
  };
  const insertEquation = () => {
    if (!latex.trim()) return;
    editor?.chain().focus().insertMath(latex.trim()).run();
    setOpen(false);
  };

  let preview = "";
  try {
    preview = katex.renderToString(latex || "\\,", { throwOnError: false });
  } catch {
    preview = "Invalid LaTeX";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Insert special character or equation"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Sigma size={17} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Special characters & equations</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "10px 16px 0" }}>
          <TabBtn active={tab === "chars"} icon={Type} label="Characters" onClick={() => setTab("chars")} />
          <TabBtn active={tab === "equation"} icon={Sigma} label="Equation" onClick={() => setTab("equation")} />
        </div>

        {tab === "chars" ? (
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => setCat(i)}
                  style={{ fontSize: 12, padding: "5px 11px", borderRadius: 999, border: cat === i ? "1px solid var(--accent)" : "1px solid var(--border)", background: cat === i ? "var(--accent-soft)" : "var(--bg-elev-2)", color: cat === i ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
              {CATEGORIES[cat].chars.map((ch, i) => (
                <button
                  key={`${ch}-${i}`}
                  onMouseDown={(e) => { e.preventDefault(); insertChar(ch); }}
                  style={{ height: 36, fontSize: 18, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elev-2)", color: "var(--text)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elev-2)")}
                >
                  {ch}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10 }}>Click a character to insert it at the cursor.</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>Presets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {EQUATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setLatex(p.latex)}
                  style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elev-2)", color: "var(--text-secondary)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6 }}>LaTeX</div>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text)", padding: "9px 11px", fontSize: 13, fontFamily: "var(--font-mono)", outline: "none" }}
            />
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "12px 0 6px" }}>Preview</div>
            <div
              style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, background: "var(--bg-elev-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 20, overflowX: "auto" }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
            <button
              onClick={insertEquation}
              style={{ width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              Insert equation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sigma; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "9px 9px 0 0", fontSize: 13, fontWeight: 500, color: active ? "var(--accent)" : "var(--text-secondary)", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent" }}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
