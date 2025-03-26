import { Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Star, StarHalf } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={16} className="fill-current" />
        ))}
        {hasHalfStar && <StarHalf size={16} className="fill-current" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={16} className="text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden product-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="block relative">
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
            New
          </span>
        )}
        {product.isSale && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
            Sale
          </span>
        )}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium">{product.name}</h3>
            <div>{renderRating(product.rating)}</div>
          </div>
          <p className="text-gray-500 text-sm mb-2">{product.shortDescription}</p>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
              }}
              className="w-10 h-10 rounded-full"
              disabled={!product.inStock}
            >
              <ShoppingBag size={18} />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
