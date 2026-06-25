"use client";

import { useMemo } from "react";
import { computeStats } from "@/lib/stats";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
        {value}
      </span>
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
    </span>
  );
}

export function StatsBar({ text }: { text: string }) {
  const s = useMemo(() => computeStats(text), [text]);
  return (
    <footer
      style={{
        height: 30,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 20px",
        fontSize: 12,
        borderTop: "1px solid var(--border)",
        background: "var(--bg-elev)",
      }}
    >
      <Stat value={s.words.toLocaleString()} label="words" />
      <Stat value={s.characters.toLocaleString()} label="characters" />
      <Stat value={s.paragraphs} label="paragraphs" />
      <span style={{ flex: 1 }} />
      <Stat value={`${s.readingTime} min`} label="read" />
    </footer>
  );
}
