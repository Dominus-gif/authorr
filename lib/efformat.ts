import type { DocStatus, DocVersion, TreeNode } from "./types";

/**
 * `.ef` (EasyFrame Editor Format) — a structured, integrity-signed document
 * container. JSON payload (text nodes, styles, media, comments, version
 * metadata) is base64-wrapped behind a magic prefix so it round-trips only
 * through this app, and carries a signature so tampering is detectable.
 *
 * Note: this is integrity signing, not confidentiality. True encryption needs
 * a key-management service and lands in the services phase.
 */
export const EF_MAGIC = "EFW1";
export const EF_SCHEMA_VERSION = 1;
const SECRET = "easyframe-integrity-v1"; // salt for the signature digest

export interface EFPayload {
  format: "EasyFrame";
  schema: number;
  generatedAt: number;
  doc: {
    id: string;
    name: string;
    status: DocStatus;
    updatedAt: number;
  };
  content: {
    html: string;
    json: unknown; // ProseMirror JSON
  };
  versions: DocVersion[];
}

/** djb2 string hash → base36 digest. Deterministic, dependency-free. */
function digest(input: string): string {
  let h = 5381;
  const s = SECRET + input;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function toBase64(str: string): string {
  if (typeof window !== "undefined") {
    return window.btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(b64: string): string {
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(window.atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

export function serializeEF(
  doc: TreeNode,
  html: string,
  json: unknown,
  versions: DocVersion[],
): string {
  const payload: EFPayload = {
    format: "EasyFrame",
    schema: EF_SCHEMA_VERSION,
    generatedAt: Date.now(),
    doc: {
      id: doc.id,
      name: doc.name,
      status: doc.status ?? "draft",
      updatedAt: doc.updatedAt ?? Date.now(),
    },
    content: { html, json },
    versions,
  };
  const body = JSON.stringify(payload);
  const signature = digest(body);
  return `${EF_MAGIC}.${signature}.${toBase64(body)}`;
}

export interface EFParseResult {
  ok: boolean;
  error?: string;
  payload?: EFPayload;
  /** true when the file parsed but the signature did not match */
  tampered?: boolean;
}

export function parseEF(raw: string): EFParseResult {
  const text = raw.trim();
  const parts = text.split(".");
  if (parts.length !== 3 || parts[0] !== EF_MAGIC) {
    return { ok: false, error: "Not a valid .ef file." };
  }
  const [, signature, b64] = parts;
  let body: string;
  try {
    body = fromBase64(b64);
  } catch {
    return { ok: false, error: "Corrupted .ef payload." };
  }
  const tampered = digest(body) !== signature;
  let payload: EFPayload;
  try {
    payload = JSON.parse(body) as EFPayload;
  } catch {
    return { ok: false, error: "Unreadable .ef payload.", tampered };
  }
  if (payload.format !== "EasyFrame") {
    return { ok: false, error: "Unrecognized format.", tampered };
  }
  return { ok: !tampered, payload, tampered };
}
