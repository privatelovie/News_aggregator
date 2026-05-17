import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookmarkArticle } from "@/lib/recommendations/tracking";
import { articleEventSchema } from "@/lib/recommendations/validation";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      article: {
        include: {
          category: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    data: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      article: bookmark.article
    }))
  });
}

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

  const bookmark = await bookmarkArticle(session.user.id, parsed.data);

  return NextResponse.json({ data: bookmark }, { status: 201 });
}
