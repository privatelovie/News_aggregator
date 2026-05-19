import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sourcePreferenceSchema } from "@/lib/recommendations/validation";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const preferences = await prisma.sourcePreference.findMany({
    where: { userId: session.user.id },
    orderBy: [{ action: "asc" }, { source: "asc" }]
  });

  return NextResponse.json({ data: preferences });
}

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sourcePreferenceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid source preference payload." },
      { status: 400 }
    );
  }

  const preference = await prisma.sourcePreference.upsert({
    where: {
      userId_source: {
        userId: session.user.id,
        source: parsed.data.source
      }
    },
    update: {
      action: parsed.data.action,
      hideSensational: parsed.data.hideSensational,
      preferredRegion: parsed.data.preferredRegion,
      preferredLanguage: parsed.data.preferredLanguage
    },
    create: {
      userId: session.user.id,
      source: parsed.data.source,
      action: parsed.data.action,
      hideSensational: parsed.data.hideSensational,
      preferredRegion: parsed.data.preferredRegion,
      preferredLanguage: parsed.data.preferredLanguage
    }
  });

  return NextResponse.json({ data: preference });
}
