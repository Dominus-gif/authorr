export interface Provider {
  id: string;
  label: string;
  hosts: string[];
  /** iframe-embeddable video; otherwise rendered as a safe link card */
  iframe: boolean;
}

export const PROVIDERS: Provider[] = [
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], iframe: true },
  { id: "vimeo", label: "Vimeo", hosts: ["vimeo.com"], iframe: true },
  { id: "wikipedia", label: "Wikipedia", hosts: ["wikipedia.org"], iframe: false },
  { id: "github", label: "GitHub", hosts: ["github.com"], iframe: false },
  { id: "medium", label: "Medium", hosts: ["medium.com"], iframe: false },
  { id: "twitter", label: "Twitter / X", hosts: ["twitter.com", "x.com"], iframe: false },
];

export function detectProvider(url: string): Provider | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  return (
    PROVIDERS.find((p) =>
      p.hosts.some((h) => host === h || host.endsWith("." + h)),
    ) ?? null
  );
}

export function isTrusted(url: string): boolean {
  return detectProvider(url) !== null;
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function vimeoId(url: string): string | null {
  const m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  return m ? m[1] : null;
}

export interface EmbedInfo {
  provider: string;
  label: string;
  href: string;
  iframeSrc: string | null;
  domain: string;
}

export function resolveEmbed(url: string): EmbedInfo | null {
  const provider = detectProvider(url);
  if (!provider) return null;
  let iframeSrc: string | null = null;
  if (provider.id === "youtube") {
    const id = youtubeId(url);
    iframeSrc = id ? `https://www.youtube.com/embed/${id}` : null;
  } else if (provider.id === "vimeo") {
    const id = vimeoId(url);
    iframeSrc = id ? `https://player.vimeo.com/video/${id}` : null;
  }
  let domain = url;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }
  return {
    provider: provider.id,
    label: provider.label,
    href: url,
    iframeSrc,
    domain,
  };
}
