import { NextResponse } from "next/server";

import { getModel, parseSettings } from "@/generation/catalog";
import type { GenerationPlane } from "@/generation/catalog";
import { createPlatformClient } from "@/generation/platform";
import { toPlatform } from "@/generation/to-platform";
import { writeStudioEvent } from "@/server/events";
import { managedGatewayCredentials, requireInternalApiToken } from "@/server/gateway";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireInternalApiToken(request);
    const input = (await request.json()) as Partial<GenerationPlane>;
    if (typeof input.model !== "string") throw new Error("model is required");
    if (!input.prompt || typeof input.prompt.text !== "string" || !input.prompt.text.trim()) {
      throw new Error("prompt.text is required");
    }
    const model = getModel(input.model);
    const plane: GenerationPlane = {
      model: model.id,
      prompt: { text: input.prompt.text.trim() },
      media: input.media ?? {},
      settings: parseSettings(model, input.settings ?? {}),
    };
    const credentials = managedGatewayCredentials();
    if (!credentials) throw new Error("Generation gateway is not configured");
    const { path, body } = toPlatform(plane);
    const queued = await createPlatformClient(credentials).submit(path, body);
    await writeStudioEvent("generation.submitted", {
      requestId: queued.requestId,
      model: model.id,
      surface: model.surface,
      source: "api-v2",
    });
    return NextResponse.json(queued, { status: 202 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
