import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/app/providers";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Neural News | AI-Powered News Aggregator",
    template: "%s | Neural News"
  },
  description:
    "Personalized AI news briefs with semantic ranking, summaries, trending signals, and saved articles.",
  applicationName: "Neural News",
  keywords: [
    "AI news",
    "news aggregator",
    "personalized feed",
    "article summaries",
    "semantic search"
  ],
  authors: [{ name: "Neural News" }],
  creator: "Neural News",
  publisher: "Neural News",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Neural News",
    title: "Neural News | AI-Powered News Aggregator",
    description:
      "Personalized AI news briefs with semantic ranking, summaries, trending signals, and saved articles."
  },
  twitter: {
    card: "summary_large_image",
    title: "Neural News",
    description:
      "Personalized AI news briefs with semantic ranking, summaries, trending signals, and saved articles."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
