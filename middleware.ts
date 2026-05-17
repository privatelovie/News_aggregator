export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/feed/:path*",
    "/bookmarks/:path*",
    "/profile/:path*",
    "/api/feed/:path*",
    "/api/interactions/:path*",
    "/api/bookmarks/:path*",
    "/api/ai/:path*",
    "/api/embeddings/:path*"
  ]
};
