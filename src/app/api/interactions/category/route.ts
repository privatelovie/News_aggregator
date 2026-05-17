import { NextResponse } from "next/server";
import { categoryEventSchema } from "@/lib/recommendations/validation";
import { trackCategoryView } from "@/lib/recommendations/tracking";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categoryEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid category payload." },
      { status: 400 }
    );
  }

  const categoryView = await trackCategoryView(session.user.id, parsed.data);

  return NextResponse.json({ data: categoryView });
}
