import { NextResponse } from "next/server";
import { loadPublishedWedding } from "@/lib/wedding-publication";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const wedding = await loadPublishedWedding(slug);
  if (!wedding) return NextResponse.json({ message: "Wedding page not found." }, { status: 404 });
  return NextResponse.json(wedding, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
