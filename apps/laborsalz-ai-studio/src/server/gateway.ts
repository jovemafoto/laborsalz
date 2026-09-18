import { timingSafeEqual } from "node:crypto";

import { parseCredentialInput } from "@/generation/credentials";

export const DEFAULT_HF_API_BASE_URL = "https://platform.higgsfield.ai";

export function generationBaseUrl(): string {
  return process.env.HF_API_BASE_URL?.trim() || DEFAULT_HF_API_BASE_URL;
}

export function managedGatewayCredentials(): {
  apiKey: string;
  baseUrl: string;
} | null {
  const rawKey = process.env.LABORSALZ_AI_API_KEY?.trim();
  const baseUrl = generationBaseUrl();
  if (!rawKey) return null;
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
