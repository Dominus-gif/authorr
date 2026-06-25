export interface DocStats {
  words: number;
  characters: number;
  paragraphs: number;
  sentences: number;
  readingTime: number; // minutes, rounded up, min 1 when words > 0
}

const WPM = 200;

export function computeStats(text: string): DocStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const characters = text.length;
  const paragraphs = trimmed
    ? trimmed.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0).length
    : 0;
  const sentences = trimmed
    ? (trimmed.match(/[.!?]+(\s|$)/g) || []).length || (words ? 1 : 0)
    : 0;
  const readingTime = words ? Math.max(1, Math.round(words / WPM)) : 0;
  return { words, characters, paragraphs, sentences, readingTime };
}
