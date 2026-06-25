/** Local extractive document summary — a stand-in for the Claude-powered
 *  summary (services phase). Explains what a document appears to be about. */

const STOP = new Set(
  "the a an and or but of to in on at for with by from as is are was were be been being this that these those it its his her their our your my we you they he she i not no do does did has have had will would can could should may might must over under into onto about above below up down out off then than so if while when where which who whom what why how all any some more most other such only own same too very just also".split(
    " ",
  ),
);

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function topics(text: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    if (STOP.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export interface DocSummary {
  empty: boolean;
  intent: string;
  bullets: string[];
  topics: string[];
  words: number;
  readingMin: number;
}

export function summarizeDocument(text: string): DocSummary {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  if (words < 8) {
    return {
      empty: true,
      intent: "This is a new, mostly empty document. Start writing and I'll summarize its intent and what it covers.",
      bullets: [],
      topics: [],
      words,
      readingMin: 0,
    };
  }
  const sents = sentences(clean);
  const tops = topics(clean, 6);
  const lead = sents.slice(0, 2).join(" ");
  const intent = tops.length
    ? `This document appears to be about ${tops.slice(0, 3).join(", ")}. ${lead}`.slice(0, 320)
    : lead.slice(0, 320);
  // Pick a few representative sentences (lead + ones rich in top topics).
  const scored = sents
    .map((s) => ({ s, score: tops.reduce((n, t) => n + (s.toLowerCase().includes(t) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.s);
  const bullets = Array.from(new Set([sents[0], ...scored])).filter(Boolean).slice(0, 4);
  return {
    empty: false,
    intent,
    bullets,
    topics: tops,
    words,
    readingMin: Math.max(1, Math.round(words / 200)),
  };
}
