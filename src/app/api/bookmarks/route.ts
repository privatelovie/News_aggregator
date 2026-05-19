import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookmarkArticle } from "@/lib/recommendations/tracking";
import {
  bookmarkCreateSchema,
  bookmarkMetadataSchema
} from "@/lib/recommendations/validation";
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
      folder: bookmark.folder,
      tags: bookmark.tags,
      note: bookmark.note,
      offlineSnapshot: bookmark.offlineSnapshot,
      offlineSavedAt: bookmark.offlineSavedAt,
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
  const parsed = bookmarkCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid article payload." }, { status: 400 });
  }

  const bookmark = await bookmarkArticle(session.user.id, parsed.data, parsed.data.bookmark);

  return NextResponse.json({ data: bookmark }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookmarkMetadataSchema.safeParse(body);

  if (!parsed.success || !parsed.data.bookmarkId) {
    return NextResponse.json(
      { message: "Invalid bookmark metadata payload." },
      { status: 400 }
    );
  }

  const offlineSnapshot = parsed.data.offlineSnapshot?.trim() || null;
  const bookmark = await prisma.bookmark.update({
    where: {
      id: parsed.data.bookmarkId,
      userId: session.user.id
    },
    data: {
      folder: parsed.data.folder,
      tags: parsed.data.tags,
      note: parsed.data.note,
      offlineSnapshot,
      offlineSavedAt: offlineSnapshot ? new Date() : null
    },
    include: {
      article: {
        include: {
          category: true
        }
      }
    }
  });

  return NextResponse.json({ data: bookmark });
}
