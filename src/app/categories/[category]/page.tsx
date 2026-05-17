import { PagePlaceholder } from "@/components/ui/page-placeholder";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  return (
    <PagePlaceholder
      title={`${category.charAt(0).toUpperCase()}${category.slice(1)} News`}
      description="Category-specific feeds are scaffolded and ready for API integration."
    />
  );
}
