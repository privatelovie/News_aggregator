import { NextResponse } from "next/server";
import { createAndStoreArticleEmbedding } from "@/lib/embeddings/articles";
import { embedArticleRequestSchema } from "@/lib/embeddings/validation";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = embedArticleRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid article embedding payload." },
      { status: 400 }
    );
  }

  try {
    const result = await createAndStoreArticleEmbedding(parsed.data.article);

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to embed article."
      },
      { status: 502 }
    );
  }
}
