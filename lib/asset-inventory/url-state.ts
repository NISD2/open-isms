import type { AssetLayer } from "./types";

// URL hash state. The user's inventory lives in the URL fragment (#) so
// the server never sees it — full privacy, no signup, every state is one
// shareable link. Format:
//
//   #i=<base64-url-encoded JSON>
//
// JSON shape (short keys to keep URLs compact):
//   { s: string[]   // sector ids
//   , c: string[]   // checked catalog item ids
//   , x: Array<{ n: string, l: AssetLayer }>  // custom-named assets
//   }

export interface UrlState {
  sectors: string[];
  checked: string[];
  custom: Array<{ name: string; layer: AssetLayer }>;
}

export const URL_STATE_PARAM = "i";

function encodeBase64Url(str: string): string {
  // btoa fallback for non-ASCII via TextEncoder.
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(b64url: string): string {
  const pad = b64url.length % 4 === 0 ? "" : "=".repeat(4 - (b64url.length % 4));
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeUrlState(state: UrlState): string {
  const json = JSON.stringify({
    s: state.sectors,
    c: state.checked,
    x: state.custom.map((c) => ({ n: c.name, l: c.layer })),
  });
  return encodeBase64Url(json);
}

export function decodeUrlState(encoded: string): UrlState | null {
  try {
    const json = decodeBase64Url(encoded);
    const parsed = JSON.parse(json) as {
      s?: unknown;
      c?: unknown;
      x?: unknown;
    };
    const sectors = Array.isArray(parsed.s)
      ? parsed.s.filter((v): v is string => typeof v === "string")
      : [];
    const checked = Array.isArray(parsed.c)
      ? parsed.c.filter((v): v is string => typeof v === "string")
      : [];
    const custom = Array.isArray(parsed.x)
      ? parsed.x
          .filter(
            (v): v is { n: string; l: string } =>
              typeof v === "object" &&
              v !== null &&
              typeof (v as { n: unknown }).n === "string" &&
              typeof (v as { l: unknown }).l === "string",
          )
          .map((v) => ({ name: v.n, layer: v.l as AssetLayer }))
      : [];
    return { sectors, checked, custom };
  } catch {
    return null;
  }
}

/** Read the state out of `window.location.hash` (client-side only). */
export function readStateFromHash(): UrlState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const encoded = params.get(URL_STATE_PARAM);
  if (!encoded) return null;
  return decodeUrlState(encoded);
}

/** Push the encoded state into `window.location.hash`. */
export function writeStateToHash(state: UrlState): void {
  if (typeof window === "undefined") return;
  const encoded = encodeUrlState(state);
  const newHash = `#${URL_STATE_PARAM}=${encoded}`;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${newHash}`);
}
