/** ProWritingAid-style local analysis: readability, glue/sticky sentences,
 *  business-jargon detection, and sentence-length variety. All offline. */

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s));
}

function words(s: string): string[] {
  return s.match(/[A-Za-z'’-]+/g) ?? [];
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

// ── Glue words (high-frequency function words; sticky = too many) ──
const GLUE = new Set(
  ("a an and as at be been being but by for from had has have he her his i if in into is it its of off on or our she so than that the their them then there these they this to too up was we were what when which who will with would you your am are be do does did just only over under about above below out very can could should may might must shall not no nor".split(
    " ",
  )),
);

export interface SentenceStat {
  text: string;
  wordCount: number;
  gluePct: number;
  sticky: boolean;
}

export interface ProReport {
  readingEase: number; // 0-100 (higher = easier)
  grade: number; // US grade level
  gradeLabel: string;
  avgSentence: number;
  sentences: SentenceStat[];
  sticky: SentenceStat[];
  jargon: { phrase: string; suggestion: string }[];
  lengths: number[]; // word count per sentence (variety map)
  passive: number;
  overused: { word: string; count: number }[];
  adverbs: number;
  vague: { word: string; count: number }[];
  score: number; // 0-100 overall writing-quality score
}

const JARGON: { phrase: string; suggestion: string }[] = [
  { phrase: "synergize", suggestion: "combine / work together" },
  { phrase: "synergy", suggestion: "teamwork" },
  { phrase: "leverage", suggestion: "use" },
  { phrase: "think outside the box", suggestion: "be creative" },
  { phrase: "circle back", suggestion: "follow up" },
  { phrase: "low-hanging fruit", suggestion: "easy wins" },
  { phrase: "move the needle", suggestion: "make a difference" },
  { phrase: "boil the ocean", suggestion: "do too much" },
  { phrase: "bandwidth", suggestion: "time / capacity" },
  { phrase: "deep dive", suggestion: "examine closely" },
  { phrase: "touch base", suggestion: "talk" },
  { phrase: "going forward", suggestion: "from now on" },
  { phrase: "at the end of the day", suggestion: "ultimately" },
  { phrase: "deliverable", suggestion: "result / output" },
  { phrase: "actionable", suggestion: "practical" },
  { phrase: "holistic", suggestion: "complete" },
  { phrase: "ideate", suggestion: "brainstorm" },
  { phrase: "paradigm shift", suggestion: "big change" },
  { phrase: "value-add", suggestion: "benefit" },
  { phrase: "core competency", suggestion: "strength" },
  { phrase: "best practice", suggestion: "proven method" },
  { phrase: "mission-critical", suggestion: "essential" },
  { phrase: "seamless", suggestion: "smooth" },
  { phrase: "robust", suggestion: "strong / reliable" },
  { phrase: "scalable", suggestion: "able to grow" },
  { phrase: "disrupt", suggestion: "change" },
  { phrase: "ecosystem", suggestion: "system / network" },
  { phrase: "utilize", suggestion: "use" },
  { phrase: "in order to", suggestion: "to" },
  { phrase: "due to the fact that", suggestion: "because" },
];

const PASSIVE = /\b(?:am|is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi;

function gradeLabel(g: number): string {
  if (g <= 6) return "Very easy · Grade 6";
  if (g <= 8) return "Plain English · Grade 7–8";
  if (g <= 10) return "Fairly readable · Grade 9–10";
  if (g <= 13) return "Fairly hard · Grade 11–13";
  if (g <= 16) return "Difficult · college";
  return "Very difficult · graduate";
}

export function proAnalyze(text: string): ProReport {
  const sents = splitSentences(text);
  const allWords = words(text);
  const totalWords = allWords.length || 1;
  const totalSyll = allWords.reduce((n, w) => n + countSyllables(w), 0);
  const ease = 206.835 - 1.015 * (totalWords / Math.max(1, sents.length)) - 84.6 * (totalSyll / totalWords);
  const grade = 0.39 * (totalWords / Math.max(1, sents.length)) + 11.8 * (totalSyll / totalWords) - 15.59;

  const stats: SentenceStat[] = sents.map((s) => {
    const ws = words(s);
    const glue = ws.filter((w) => GLUE.has(w.toLowerCase())).length;
    const gluePct = ws.length ? Math.round((glue / ws.length) * 100) : 0;
    return { text: s, wordCount: ws.length, gluePct, sticky: ws.length >= 8 && gluePct > 45 };
  });

  const jargonHits: { phrase: string; suggestion: string }[] = [];
  const lower = text.toLowerCase();
  for (const j of JARGON) {
    if (lower.includes(j.phrase)) jargonHits.push(j);
  }

  // Overused content words (≥4 occurrences, not glue/function words).
  const freq = new Map<string, number>();
  for (const w of allWords) {
    const lw = w.toLowerCase();
    if (lw.length < 4 || GLUE.has(lw)) continue;
    freq.set(lw, (freq.get(lw) ?? 0) + 1);
  }
  const overused = [...freq.entries()].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, count }));

  // Adverbs (-ly) and vague intensifiers.
  const adverbs = (text.match(/\b\w+ly\b/gi) || []).filter((w) => !/^(only|reply|apply|family|supply|early|holy|italy|ugly|fully|rely)$/i.test(w)).length;
  const VAGUE = ["very", "really", "quite", "just", "actually", "basically", "literally", "things", "stuff", "good", "nice", "a lot"];
  const vague = VAGUE.map((v) => ({ word: v, count: (lower.match(new RegExp(`\\b${v}\\b`, "g")) || []).length })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);

  // Composite writing score: readability + low stickiness + low jargon + variety.
  const stickyPct = stats.length ? stats.filter((s) => s.sticky).length / stats.length : 0;
  const lenSet = new Set(stats.map((s) => Math.round(s.wordCount / 5)));
  const variety = stats.length > 2 ? Math.min(1, lenSet.size / Math.min(stats.length, 6)) : 0.7;
  const score = Math.max(
    0,
    Math.min(100, Math.round(
      0.4 * Math.max(0, Math.min(100, ease)) +
      0.25 * (1 - stickyPct) * 100 +
      0.15 * Math.max(0, 100 - jargonHits.length * 12) +
      0.2 * variety * 100,
    )),
  );

  return {
    readingEase: Math.max(0, Math.min(100, Math.round(ease))),
    grade: Math.max(1, Math.round(grade * 10) / 10),
    gradeLabel: gradeLabel(grade),
    avgSentence: sents.length ? Math.round(totalWords / sents.length) : 0,
    sentences: stats,
    sticky: stats.filter((s) => s.sticky),
    jargon: jargonHits,
    lengths: stats.map((s) => s.wordCount),
    passive: (text.match(PASSIVE) || []).length,
    overused,
    adverbs,
    vague,
    score,
  };
}
