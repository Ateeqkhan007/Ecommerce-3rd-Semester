import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  if (categories.length === 0) {
    return (
      <div className="flex overflow-x-auto mb-8 pb-2 space-x-4">
        <Skeleton className="w-24 h-10 rounded-full" />
        <Skeleton className="w-24 h-10 rounded-full" />
        <Skeleton className="w-24 h-10 rounded-full" />
        <Skeleton className="w-24 h-10 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto mb-8 pb-2 space-x-4">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        className="rounded-full whitespace-nowrap"
        onClick={() => onSelectCategory(null)}
      >
        All Products
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          className="rounded-full whitespace-nowrap"
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
