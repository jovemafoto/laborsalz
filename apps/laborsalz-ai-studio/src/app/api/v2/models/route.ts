import { NextResponse } from "next/server";

import { MODELS } from "@/generation/catalog";

export function GET() {
  return NextResponse.json({
    count: MODELS.length,
    models: MODELS.map((model) => ({
      id: model.id,
      label: model.label,
      surface: model.surface,
      roles: model.roles,
      settings: model.settings,
    })),
  });
}
