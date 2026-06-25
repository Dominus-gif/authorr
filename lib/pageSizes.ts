export type PageSizeId =
  | "letter" | "legal" | "tabloid" | "executive" | "statement"
  | "a3" | "a4" | "a5" | "b5";

export interface PageSizeDef {
  label: string;
  dim: string;
  group: "US" | "ISO";
  width: number; // px at 96dpi (content-column width)
  css: string; // CSS @page size value
}

// Widths are physical size × 96dpi (inches) or × 3.7795 (mm).
export const PAGE_SIZES: Record<PageSizeId, PageSizeDef> = {
  letter: { label: "US Letter", dim: '8.5 × 11"', group: "US", width: 816, css: "letter" },
  legal: { label: "US Legal", dim: '8.5 × 14"', group: "US", width: 816, css: "legal" },
  tabloid: { label: "Tabloid / Ledger", dim: '11 × 17"', group: "US", width: 1056, css: "11in 17in" },
  executive: { label: "Executive", dim: '7.25 × 10.5"', group: "US", width: 696, css: "7.25in 10.5in" },
  statement: { label: "Statement", dim: '5.5 × 8.5"', group: "US", width: 528, css: "5.5in 8.5in" },
  a3: { label: "A3", dim: "297 × 420 mm", group: "ISO", width: 1123, css: "A3" },
  a4: { label: "A4", dim: "210 × 297 mm", group: "ISO", width: 794, css: "A4" },
  a5: { label: "A5", dim: "148 × 210 mm", group: "ISO", width: 559, css: "A5" },
  b5: { label: "B5", dim: "176 × 250 mm", group: "ISO", width: 665, css: "B5" },
};

export const PAGE_SIZE_ORDER: PageSizeId[] = [
  "letter", "legal", "tabloid", "executive", "statement",
  "a4", "a3", "a5", "b5",
];

export function pageWidth(id: PageSizeId): number {
  return PAGE_SIZES[id]?.width ?? 816;
}
