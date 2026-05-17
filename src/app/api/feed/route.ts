import { NextResponse } from "next/server";
import {
  parseNewsSearchParams
} from "@/lib/news/aggregator";
import { FEED_RANKING_WEIGHTS } from "@/lib/recommendations/constants";
import { getRankedFeed } from "@/lib/recommendations/scoring";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = parseNewsSearchParams(searchParams);
  const result = await getRankedFeed(session.user.id, params);

  return NextResponse.json({
    data: result.articles,
    meta: {
      count: result.articles.length,
      cached: result.cached,
      errors: result.errors,
      scoring: {
        formula:
          "userEmbedding + behaviorScore + recencyScore + trendingScore",
        weights: FEED_RANKING_WEIGHTS
      }
    }
  });
}
