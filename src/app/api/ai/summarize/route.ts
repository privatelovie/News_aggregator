import { NextResponse } from "next/server";
import { articleSummaryRequestSchema } from "@/lib/ai/validation";
import { getArticleSummary } from "@/lib/ai/summaries";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = articleSummaryRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid article summarization payload." },
      { status: 400 }
    );
  }

  try {
    const summary = await getArticleSummary(parsed.data.article);

    return NextResponse.json({
      data: summary,
      meta: {
        cached: summary.cached,
        model: summary.model
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to summarize article."
      },
      { status: 502 }
    );
  }
}
