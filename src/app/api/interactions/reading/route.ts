import { NextResponse } from "next/server";
import { readingEventSchema } from "@/lib/recommendations/validation";
import { trackReadingDuration } from "@/lib/recommendations/tracking";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = readingEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid reading duration payload." },
      { status: 400 }
    );
  }

  const interaction = await trackReadingDuration(session.user.id, parsed.data);

  return NextResponse.json({ data: interaction });
}
