import { NextResponse } from "next/server";

import { getModel } from "@/generation/catalog";

export async function GET(
  _request: Request,
  context: { params: Promise<{ modelId: string }> },
) {
  try {
    const { modelId } = await context.params;
    const model = getModel(decodeURIComponent(modelId));
    const defaults = Object.fromEntries(
      Object.entries(model.settings).map(([key, field]) => [key, field.default]),
    );

    return NextResponse.json({
      model: model.id,
      label: model.label,
      surface: model.surface,
      mediaRoles: model.roles,
      parameters: model.settings,
      defaults,
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : String(caught) },
      { status: 404 },
    );
  }
}
