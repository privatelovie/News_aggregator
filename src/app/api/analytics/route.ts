import { NextResponse } from "next/server";
import { z } from "zod";

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

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", parsed.data);
  }

  return NextResponse.json({ ok: true });
}
