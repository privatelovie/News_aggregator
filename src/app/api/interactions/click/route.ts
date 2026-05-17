import { NextResponse } from "next/server";
import { articleEventSchema } from "@/lib/recommendations/validation";
import { trackArticleClick } from "@/lib/recommendations/tracking";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = articleEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid article payload." }, { status: 400 });
  }

  const interaction = await trackArticleClick(session.user.id, parsed.data);

  return NextResponse.json({ data: interaction });
}
