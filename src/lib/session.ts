import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export function getCurrentUser() {
  return getServerSession(authOptions);
}
