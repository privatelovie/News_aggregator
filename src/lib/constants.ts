export const CATEGORIES = [
  { label: "Tech", slug: "technology" },
  { label: "Sports", slug: "sports" },
  { label: "Politics", slug: "politics" },
  { label: "Business", slug: "business" },
  { label: "Science", slug: "science" }
] as const;

export const FEED_TOPICS = [
  { label: "All topics", value: "all", type: "all" },
  { label: "Technology", value: "technology", type: "category" },
  { label: "Sports", value: "sports", type: "category" },
  { label: "Politics", value: "politics", type: "category" },
  { label: "Business", value: "business", type: "category" },
  { label: "Science", value: "science", type: "category" },
  { label: "World", value: "world news", type: "query" },
  { label: "Health", value: "health news", type: "query" },
  { label: "Entertainment", value: "entertainment news", type: "query" },
  { label: "Climate", value: "climate news", type: "query" },
  { label: "Finance", value: "finance markets", type: "query" },
  { label: "Artificial Intelligence", value: "artificial intelligence", type: "query" },
  { label: "Travel", value: "travel news", type: "query" }
] as const;
