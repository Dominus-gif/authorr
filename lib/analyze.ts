/**
 * Local heuristic text analysis — a placeholder for the Claude-powered
 * AI editing suite. Everything here runs client-side and is deliberately
 * cheap; once the API is wired these become the offline fallback.
 */

export interface Sentence {
  text: string;
  words: number;
  passive: boolean;
}

export interface ToneResult {
  label: "Formal" | "Casual" | "Dramatic" | "Neutral";
  formal: number; // 0..100
  casual: number;
  dramatic: number;
}

export interface ClarityIssue {
  text: string;
  words: number;
}

export interface GrammarIssue {
  match: string;
  suggestion: string;
  reason: string;
}

export interface Analysis {
  tone: ToneResult;
  passiveCount: number;
  repetition: { word: string; count: number }[];
  longSentences: ClarityIssue[];
  grammar: GrammarIssue[];
  sentences: number;
  avgSentenceLength: number;
}

const FORMAL = [
  "therefore", "however", "furthermore", "consequently", "moreover",
  "regarding", "additionally", "thus", "hence", "accordingly",
];
const CASUAL = [
  "gonna", "kinda", "yeah", "stuff", "things", "really", "just",
  "ok", "okay", "cool", "lots", "bunch",
];
const DRAMATIC = [
  "never", "always", "forever", "shattered", "blazing", "desperate",
  "agony", "triumph", "doom", "fierce", "trembling", "silence",
];
const PASSIVE_BE = ["is", "are", "was", "were", "be", "been", "being"];
const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for",
  "with", "at", "by", "from", "as", "it", "its", "this", "that", "is",
  "are", "was", "were", "be", "i", "you", "he", "she", "they", "we",
  "my", "your", "his", "her", "their", "our", "not", "no", "so", "if",
  "then", "than", "into", "out", "up", "down", "over", "about",
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isPassive(sentence: string): boolean {
  const w = sentence.toLowerCase().split(/\s+/);
  for (let i = 0; i < w.length - 1; i++) {
    if (PASSIVE_BE.includes(w[i])) {
      const next = w[i + 1].replace(/[^a-z]/g, "");
      if (/(ed|en)$/.test(next) && next.length > 3) return true;
    }
  }
  return false;
}

export function analyze(text: string): Analysis {
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z']+/g) || [];
  const total = words.length || 1;

  const count = (list: string[]) =>
    words.filter((w) => list.includes(w)).length;
  const fRaw = count(FORMAL);
  const cRaw = count(CASUAL);
  const dRaw = count(DRAMATIC);
  const sum = fRaw + cRaw + dRaw;

  // Density-based scoring with a neutral baseline.
  const scale = (raw: number) =>
    Math.min(100, Math.round((raw / total) * 1400) + (sum ? 8 : 0));
  const tone: ToneResult = {
    formal: scale(fRaw),
    casual: scale(cRaw),
    dramatic: scale(dRaw),
    label: "Neutral",
  };
  const top = Math.max(tone.formal, tone.casual, tone.dramatic);
  if (top < 12) tone.label = "Neutral";
  else if (top === tone.formal) tone.label = "Formal";
  else if (top === tone.casual) tone.label = "Casual";
  else tone.label = "Dramatic";

  const sentences = splitSentences(text);
  let passiveCount = 0;
  const longSentences: ClarityIssue[] = [];
  for (const s of sentences) {
    if (isPassive(s)) passiveCount++;
    const wc = s.split(/\s+/).filter(Boolean).length;
    if (wc >= 28) longSentences.push({ text: s, words: wc });
  }

  // Repetition — content words used 3+ times.
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const repetition = [...freq.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word, count]) => ({ word, count }));

  // Grammar — cheap, high-precision heuristics.
  const grammar: GrammarIssue[] = [];
  if (/\bi\b/.test(text) && /(^|[.!?]\s|\s)i\s/.test(text)) {
    grammar.push({
      match: "i",
      suggestion: "I",
      reason: 'Capitalize the pronoun "I".',
    });
  }
  if (/\bteh\b/i.test(text))
    grammar.push({ match: "teh", suggestion: "the", reason: "Likely typo." });
  if (/ {2,}/.test(text))
    grammar.push({
      match: "double space",
      suggestion: "single space",
      reason: "Remove the extra space.",
    });
  if (/\b(\w+)\s+\1\b/i.test(text)) {
    const m = text.match(/\b(\w+)\s+\1\b/i);
    if (m)
      grammar.push({
        match: m[0],
        suggestion: m[1],
        reason: "Repeated word.",
      });
  }

  const sentenceCount = sentences.length;
  const avg =
    sentenceCount > 0
      ? Math.round(
          sentences.reduce(
            (a, s) => a + s.split(/\s+/).filter(Boolean).length,
            0,
          ) / sentenceCount,
        )
      : 0;

  return {
    tone,
    passiveCount,
    repetition,
    longSentences,
    grammar,
    sentences: sentenceCount,
    avgSentenceLength: avg,
  };
}
