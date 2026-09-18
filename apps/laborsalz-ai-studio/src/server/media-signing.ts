import { createHmac, timingSafeEqual } from "node:crypto";

import { SITE_URL } from "@/site";

function signingSecret(): string {
  const secret = process.env.LABORSALZ_MEDIA_SIGNING_SECRET?.trim();
  if (!secret) throw new Error("Missing LABORSALZ_MEDIA_SIGNING_SECRET");
  return secret;
}

function signatureFor(relativePath: string, expiresAt: number): string {
  return createHmac("sha256", signingSecret())
    .update(`${relativePath}\n${expiresAt}`)
    .digest("hex");
}

export function createSignedMediaUrl(
  relativePath: string,
  ttlSeconds = 60 * 60 * 24,
): string {
  const normalized = relativePath.replace(/^\/+/, "");
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = signatureFor(normalized, expiresAt);
  const encoded = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${SITE_URL}/api/v2/media/${encoded}?exp=${expiresAt}&sig=${signature}`;
}

export function verifySignedMediaRequest(
  relativePath: string,
  rawExpiry: string | null,
  rawSignature: string | null,
): boolean {
  if (!rawExpiry || !rawSignature) return false;
  const expiresAt = Number(rawExpiry);
  if (!Number.isInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = signatureFor(relativePath.replace(/^\/+/, ""), expiresAt);
  if (!/^[a-f0-9]{64}$/i.test(rawSignature)) return false;
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(rawSignature, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
