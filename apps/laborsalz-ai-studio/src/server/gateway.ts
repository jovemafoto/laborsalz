import { timingSafeEqual } from "node:crypto";

import { parseCredentialInput } from "@/generation/credentials";

export function managedGatewayCredentials(): {
  apiKey: string;
  baseUrl: string;
} | null {
  const rawKey = process.env.LABORSALZ_AI_API_KEY?.trim();
  const baseUrl = process.env.HF_API_BASE_URL?.trim();
  if (!rawKey || !baseUrl) return null;
  const { apiKey } = parseCredentialInput({ apiKey: rawKey });
  return { apiKey, baseUrl };
}

export function requireInternalApiToken(request: Request): void {
  const expected = process.env.LABORSALZ_INTERNAL_API_TOKEN?.trim();
  if (!expected) {
    throw new Error("LABORSALZ_INTERNAL_API_TOKEN is not configured");
  }
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Unauthorized");
  }
}
