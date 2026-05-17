import type { ArticlePreview } from "@/types/article";

export const CATEGORIES = [
  { label: "Tech", slug: "technology" },
  { label: "Sports", slug: "sports" },
  { label: "Politics", slug: "politics" },
  { label: "Business", slug: "business" },
  { label: "Science", slug: "science" }
] as const;

export const TRENDING_TOPICS = [
  {
    title: "AI policy",
    category: "Politics",
    velocity: "+42%",
    summary: "Regulators move from principle-setting to enforcement."
  },
  {
    title: "Chip markets",
    category: "Business",
    velocity: "+31%",
    summary: "Supply signals point to another infrastructure cycle."
  },
  {
    title: "Private space",
    category: "Science",
    velocity: "+24%",
    summary: "New launch windows push orbital research forward."
  },
  {
    title: "Finals race",
    category: "Sports",
    velocity: "+19%",
    summary: "Late-season performance swings reset predictions."
  },
  {
    title: "Agent startups",
    category: "Tech",
    velocity: "+36%",
    summary: "Funding shifts toward workflow-specific AI products."
  }
] as const;

export const FEATURED_ARTICLES: ArticlePreview[] = [
  {
    id: "1",
    title: "AI Briefing Pipeline Ready For Integration",
    summary:
      "Placeholder content for the homepage article grid while ingestion and ranking services are added.",
    source: "News App",
    category: "Tech",
    publishedAt: "Today",
    readTime: "4 min",
    trend: "Semantic match 91%",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "2",
    title: "Category Feeds Prepared For Editorial Expansion",
    summary:
      "The application structure supports focused feeds across technology, sports, politics, business, and science.",
    source: "News App",
    category: "Business",
    publishedAt: "Today",
    readTime: "6 min",
    trend: "Trending +31%",
    imageUrl:
      "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "3",
    title: "Bookmark Workflow Scaffolded For Saved Reads",
    summary:
      "Database models and routes are ready for a later bookmark implementation with authenticated users.",
    source: "News App",
    category: "Science",
    publishedAt: "Today",
    readTime: "3 min",
    trend: "New signal",
    imageUrl:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "4",
    title: "Personalized Ranking Blends Behavior And Freshness",
    summary:
      "Feed ordering combines embedding similarity, reading behavior, recency, and trending momentum.",
    source: "News App",
    category: "Politics",
    publishedAt: "2h ago",
    readTime: "5 min",
    trend: "Ranked for you",
    imageUrl:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "5",
    title: "Sports Analytics Models Spotlight Momentum Swings",
    summary:
      "Realtime signals and fan attention are reshaping match previews and post-game analysis.",
    source: "News App",
    category: "Sports",
    publishedAt: "3h ago",
    readTime: "4 min",
    trend: "Fast riser",
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "6",
    title: "Research Teams Turn Summaries Into Actionable Briefs",
    summary:
      "AI summaries highlight why each story matters and what readers should watch next.",
    source: "News App",
    category: "Tech",
    publishedAt: "5h ago",
    readTime: "7 min",
    trend: "AI brief",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80"
  }
];
