import { NextResponse } from "next/server";

import { STUDIO_PRESETS } from "@/presets";

export function GET() {
  return NextResponse.json({
    count: STUDIO_PRESETS.length,
    presets: STUDIO_PRESETS,
  });
}
