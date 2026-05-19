import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedPreferenceSchema } from "@/lib/recommendations/validation";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const preference = await prisma.userFeedPreference.findUnique({
    where: { userId: session.user.id }
  });

  return NextResponse.json({ data: preference });
}

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = feedPreferenceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid preference payload." },
      { status: 400 }
    );
  }

  const preference = await prisma.userFeedPreference.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: {
      userId: session.user.id,
      ...parsed.data
    }
  });

  return NextResponse.json({ data: preference });
}
