import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const analyticsEventSchema = z.object({
  type: z.string().min(1).max(80),
  payload: z.record(z.unknown()).default({}),
  timestamp: z.string().datetime().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid event." }, { status: 400 });
  }

  const session = await getCurrentUser();
  const payload = parsed.data.payload as Prisma.InputJsonObject;

  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: session?.user?.id,
        type: parsed.data.type,
        path: typeof payload.path === "string" ? payload.path : null,
        payload
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] event dropped", error);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", parsed.data);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const [events, users, bookmarks, interactions] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { createdAt: { gte: since } },
        _count: { _all: true }
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      prisma.bookmark.count({ where: { createdAt: { gte: since } } }),
      prisma.userInteraction.aggregate({
        where: { updatedAt: { gte: since } },
        _sum: { clickCount: true },
        _count: { _all: true }
      })
    ]);

    const counts = Object.fromEntries(
      events.map((event) => [event.type, event._count._all])
    );
    const pageViews = counts.page_view ?? 0;
    const articleOpens = counts.article_open ?? 0;
    const summaryOpens = counts.summary_open ?? 0;
    const searchSubmit = counts.search_submit ?? 0;
    const searchSuccess = counts.search_success ?? 0;

    return NextResponse.json({
      data: {
        rangeDays: 30,
        metrics: {
          ctr: ratio(articleOpens, pageViews),
          saveRate: ratio(bookmarks, articleOpens),
          summaryOpenRate: ratio(summaryOpens, articleOpens),
          searchSuccessRate: ratio(searchSuccess, searchSubmit),
          trackedClicks: interactions._sum.clickCount ?? 0
        },
        eventCounts: counts,
        retentionCohorts: buildWeeklyCohorts(users.map((user) => user.createdAt))
      }
    });
  } catch {
    return NextResponse.json({
      data: {
        rangeDays: 30,
        degraded: true,
        metrics: {
          ctr: 0,
          saveRate: 0,
          summaryOpenRate: 0,
          searchSuccessRate: 0,
          trackedClicks: 0
        },
        eventCounts: {},
        retentionCohorts: []
      }
    });
  }
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(3));
}

function buildWeeklyCohorts(createdAts: Date[]) {
  const cohorts = new Map<string, number>();

  for (const createdAt of createdAts) {
    const start = new Date(createdAt);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const key = start.toISOString().slice(0, 10);
    cohorts.set(key, (cohorts.get(key) ?? 0) + 1);
  }

  return Array.from(cohorts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, users]) => ({ week, users }));
}
