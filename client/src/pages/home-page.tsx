import { useQuery } from "@tanstack/react-query";
import { Product, Category } from "@shared/schema";
import ProductGrid from "@/components/product-grid";
import CategoryFilter from "@/components/category-filter";
import SearchBar from "@/components/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import CartSidebar from "@/components/cart-sidebar";
import { useCart } from "@/lib/cart-context";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isCartOpen } = useCart();

  const {
    data: products,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = products?.filter(product => {
    // First apply category filter if selected
    if (selectedCategory !== null && product.categoryId !== selectedCategory) {
      return false;
    }
    
    // Then apply search filter if there's a query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.shortDescription?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const isLoading = isProductsLoading || isCategoriesLoading;
  const error = productsError || categoriesError;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <main>
      {/* Hero Banner */}
      <section className="bg-gray-100 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Spring Collection 2023</h1>
              <p className="text-xl text-gray-600 mb-6">
                Discover the latest trends and elevate your style with our new arrivals.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
                >
                  Shop Now
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50">
                  Learn More
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                alt="Spring Collection"
                className="rounded-lg shadow-lg w-full h-80 md:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Search Bar - Mobile Only */}
          <div className="md:hidden mb-6">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          {/* Categories Bar */}
          {isLoading ? (
            <div className="flex overflow-x-auto mb-8 pb-2 space-x-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          ) : (
            <CategoryFilter
              categories={categories || []}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {/* Filters and Grid */}
          <div className="flex flex-col md:flex-row">
            {/* Filters Sidebar */}
            <div className="hidden md:block md:w-64 pr-8">
              <div className="sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <SearchBar onSearch={setSearchQuery} />
                </div>
                
                {/* Price Range - placeholder, not functional */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Price Range</h3>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">$0</span>
                      <span className="text-sm text-gray-600">$1000</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      placeholder="Min"
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      placeholder="Max"
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="md:flex-1">
              {/* Desktop Sort Options */}
              <div className="hidden md:flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {filteredProducts ? `Showing ${filteredProducts.length} products` : "Loading products..."}
                </p>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <Skeleton className="w-full h-48" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ProductGrid products={filteredProducts || []} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cart Sidebar */}
      {isCartOpen && <CartSidebar />}
    </main>
  );
}
