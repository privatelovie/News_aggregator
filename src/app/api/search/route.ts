import { NextResponse } from "next/server";
import {
  getAggregatedNews,
  parseNewsSearchParams
} from "@/lib/news/aggregator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseNewsSearchParams(searchParams);
  const result = await getAggregatedNews(params);

  return NextResponse.json({
    data: result.articles,
    meta: {
      count: result.articles.length,
      cached: result.cached,
      errors: result.errors
    }
  });
}
