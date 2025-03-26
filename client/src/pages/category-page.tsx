import { useQuery } from "@tanstack/react-query";
import { Product, Category } from "@shared/schema";
import ProductGrid from "@/components/product-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CategoryPage() {
  // Get category slug from URL params
  const params = useParams<{ slug: string }>();
  const categorySlug = params.slug;

  // Fetch categories
  const {
    data: categories,
    isLoading: isCategoriesLoading,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Find the current category
  const currentCategory = categories?.find(cat => cat.slug === categorySlug);

  // Fetch products
  const {
    data: products,
    isLoading: isProductsLoading,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products by the current category
  const filteredProducts = products?.filter(
    product => currentCategory && product.categoryId === currentCategory.id
  );

  // Loading state
  if (isProductsLoading || isCategoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state - category not found
  if (!currentCategory) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <p className="text-gray-600 mb-8">The category you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4 pl-0 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all products
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{currentCategory.name}</h1>
        <p className="text-gray-600 mt-2">Browse our selection of {currentCategory.name.toLowerCase()} products</p>
      </div>

      {filteredProducts?.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No products found</h2>
          <p className="text-gray-600">There are no products in this category yet.</p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts || []} />
      )}
    </div>
  );
}