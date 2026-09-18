import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    service: "LaborSalz AI Studio API",
    version: "2",
    endpoints: {
      health: "/api/v2/health",
      models: "/api/v2/models",
      parameters: "/api/v2/parameters/:modelId",
      presets: "/api/v2/presets",
      stats: "/api/v2/stats",
      history: "/api/v2/history",
      upload: "/api/v2/upload",
      generate: "/api/v2/generate",
      status: "/api/v2/status/:requestId",
      results: "/api/v2/results/:requestId/:asset",
    },
  });
}
