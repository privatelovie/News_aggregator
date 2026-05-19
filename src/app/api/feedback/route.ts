import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureArticle } from "@/lib/recommendations/article-persistence";
import { articleFeedbackSchema } from "@/lib/recommendations/validation";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = articleFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid feedback payload." },
      { status: 400 }
    );
  }

  const article = await ensureArticle(parsed.data.article);
  const feedback = await prisma.articleFeedback.upsert({
    where: {
      userId_articleId_reason: {
        userId: session.user.id,
        articleId: article.id,
        reason: parsed.data.reason
      }
    },
    update: {
      source: article.source,
      category: parsed.data.article.category
    },
    create: {
      userId: session.user.id,
      articleId: article.id,
      reason: parsed.data.reason,
      source: article.source,
      category: parsed.data.article.category
    }
  });

  return NextResponse.json({ data: feedback }, { status: 201 });
}
