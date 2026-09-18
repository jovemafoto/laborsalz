"use server";

import { cookies } from "next/headers";

import { getModel, parseSettings } from "./catalog";
import type { GenerationPlane } from "./catalog/types";
import {
  MissingCredentialsError,
  PLATFORM_KEY_COOKIE,
  PLATFORM_KEY_COOKIE_OPTIONS,
  decodeCredentials,
  encodeCredentials,
  parseCredentialInput,
} from "./credentials";
import { createPlatformClient } from "./platform";
import type { StatusResult } from "./platform";
import { toPlatform } from "./to-platform";
import { writeStudioEvent } from "@/server/events";
import { managedGatewayCredentials } from "@/server/gateway";

export type CredentialMode = "managed" | "cookie" | "missing";

export async function platformCredentialMode(): Promise<CredentialMode> {
  if (process.env.LABORSALZ_AI_API_KEY?.trim()) return "managed";
  return (await readStoredCredentials()) ? "cookie" : "missing";
}

export async function savePlatformCredentials(data: unknown) {
  if (process.env.LABORSALZ_AI_API_KEY?.trim()) {
    throw new Error("Platform key is managed by the LaborSalz server");
  }
  const { apiKey } = parseCredentialInput(data);
  const jar = await cookies();
  jar.set(PLATFORM_KEY_COOKIE, encodeCredentials(apiKey), PLATFORM_KEY_COOKIE_OPTIONS);
}

export async function clearPlatformCredentials() {
  if (process.env.LABORSALZ_AI_API_KEY?.trim()) {
    throw new Error("Platform key is managed by the LaborSalz server");
  }
  const jar = await cookies();
  jar.set(PLATFORM_KEY_COOKIE, "", { ...PLATFORM_KEY_COOKIE_OPTIONS, maxAge: 0 });
}

export async function hasPlatformCredentials() {
  return (await platformCredentialMode()) !== "missing";
}

export async function submitGeneration(plane: GenerationPlane) {
  const model = getModel(plane.model);
  const parsed: GenerationPlane = {
    ...plane,
    settings: parseSettings(model, plane.settings),
  };
  const { path, body } = toPlatform(parsed);
  const queued = await createPlatformClient(await readCredentials()).submit(path, body);
  await writeStudioEvent("generation.submitted", {
    requestId: queued.requestId,
    model: model.id,
    surface: model.surface,
    source: "studio-ui",
  });
  return queued;
}

export async function getGenerationStatuses(data: unknown): Promise<StatusResult[]> {
  const requestIds = parseRequestIds(data);
  const client = createPlatformClient(await readCredentials());
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      try {
        const status = await client.status(requestId);
        if (["completed", "failed", "nsfw", "canceled"].includes(status.status)) {
          await writeStudioEvent(
            status.status === "completed" ? "generation.completed" : "generation.failed",
            {
              requestId,
              status: status.status,
              source: "studio-ui",
            },
          );
        }
        return { requestId, status };
      } catch (caught) {
        return { requestId, error: caught instanceof Error ? caught.message : String(caught) };
      }
    }),
  );
}

async function readStoredCredentials() {
  const jar = await cookies();
  return decodeCredentials(jar.get(PLATFORM_KEY_COOKIE)?.value);
}

async function readCredentials() {
  const managed = managedGatewayCredentials();
  if (managed) return managed;

  if (process.env.LABORSALZ_AI_API_KEY?.trim()) {
    throw new Error("Managed platform key is set but HF_API_BASE_URL is missing or invalid");
  }

  const stored = await readStoredCredentials();
  if (!stored) throw new MissingCredentialsError();
  const baseUrl = process.env.HF_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL");
  return { ...stored, baseUrl };
}

function parseRequestIds(data: unknown): string[] {
  const payload = asObject(data, "Invalid status payload");
  const requestIds = payload.requestIds;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new Error("Invalid request ids");
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId) throw new Error("Invalid request id");
    return requestId;
  });
}

function asObject(data: unknown, message: string): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error(message);
  return data as Record<string, unknown>;
}
