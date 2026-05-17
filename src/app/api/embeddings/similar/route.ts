import { NextResponse } from "next/server";
import {
  searchSimilarArticlesByText,
  searchSimilarArticlesForUser
} from "@/lib/embeddings/search";
import { similaritySearchRequestSchema } from "@/lib/embeddings/validation";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = similaritySearchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid similarity search payload." },
      { status: 400 }
    );
  }

  if (!parsed.data.query && !parsed.data.useUserProfile) {
    return NextResponse.json(
      { message: "Provide a query or set useUserProfile to true." },
      { status: 400 }
    );
  }

  try {
    const articles = parsed.data.useUserProfile
      ? await searchSimilarArticlesForUser(session.user.id, parsed.data.limit)
      : await searchSimilarArticlesByText(parsed.data.query ?? "", parsed.data.limit);

    return NextResponse.json({
      data: articles,
      meta: {
        count: articles.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to run similarity search."
      },
      { status: 502 }
    );
  }
}
