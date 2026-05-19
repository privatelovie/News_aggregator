import { NextResponse } from "next/server";
import {
  getAggregatedNews,
  parseNewsSearchParams
} from "@/lib/news/aggregator";
import { FEED_RANKING_WEIGHTS } from "@/lib/recommendations/constants";
import { getRankedFeed } from "@/lib/recommendations/scoring";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseNewsSearchParams(searchParams);
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    const result = await getAggregatedNews(params);

    return NextResponse.json({
      data: result.articles,
      meta: {
        count: result.articles.length,
        cached: result.cached,
        errors: result.errors,
        personalized: false
      }
    });
  }

  const result = await getRankedFeed(session.user.id, params);

  return NextResponse.json({
    data: result.articles,
    meta: {
      count: result.articles.length,
      cached: result.cached,
      errors: result.errors,
      personalized: true,
      scoring: {
        formula:
          "userEmbedding + behaviorScore + recencyScore + trendingScore + sourceControlBoost",
        weights: FEED_RANKING_WEIGHTS
      }
    }
  });
}
