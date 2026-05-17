import { NextResponse } from "next/server";
import { rebuildUserProfileEmbedding } from "@/lib/embeddings/users";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await rebuildUserProfileEmbedding(session.user.id);

  return NextResponse.json({ data: result });
}
