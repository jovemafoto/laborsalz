import { NextResponse } from "next/server";

import { createPlatformClient } from "@/generation/platform";
import { writeStudioEvent } from "@/server/events";
import { managedGatewayCredentials, requireInternalApiToken } from "@/server/gateway";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    requireInternalApiToken(request);
    const { requestId } = await context.params;
    if (!requestId) throw new Error("requestId is required");
    const credentials = managedGatewayCredentials();
    if (!credentials) throw new Error("Generation gateway is not configured");
    const status = await createPlatformClient(credentials).status(requestId);
    if (["completed", "failed", "nsfw", "canceled"].includes(status.status)) {
      await writeStudioEvent(
        status.status === "completed" ? "generation.completed" : "generation.failed",
        {
          requestId,
          status: status.status,
          source: "api-v2",
        },
      );
    }
    return NextResponse.json(status);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
