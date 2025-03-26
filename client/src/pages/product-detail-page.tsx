import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Product } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import CartSidebar from "@/components/cart-sidebar";
import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = parseInt(id);
  const { addToCart, isCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  // Simulating multiple product images for gallery
  const productImages = product ? [
    product.imageUrl,
    "https://images.unsplash.com/photo-1583394838336-acd977736f90",
    "https://images.unsplash.com/photo-1487215078519-e21cc028cb29",
    "https://images.unsplash.com/photo-1608156639585-b3a7a6c10343"
  ] : [];

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="lg:w-1/2 px-4 mb-8 lg:mb-0">
            <Skeleton className="w-full h-96 rounded-lg" />
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16 rounded-md" />
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 px-4">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-10 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error ? `Error loading product: ${error.message}` : "Product not found"}
        </div>
        <Link href="/">
          <Button className="mt-4">
            Return to home
          </Button>
        </Link>
      </div>
    );
  }

  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="fill-current" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-gray-500 hover:text-primary">
                Home
              </Link>
            </li>
            <li><span className="text-gray-400 mx-1">/</span></li>
            <li className="text-gray-800 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row -mx-4">
          {/* Product Images */}
          <div className="lg:w-1/2 px-4 mb-8 lg:mb-0">
            <div className="sticky top-24">
              <div className="mb-4">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-contain rounded-lg"
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`border-2 ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    } rounded-md overflow-hidden`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 px-4">
            <div className="mb-4">
              <div className="flex items-center">
                <div className="flex items-center">
                  {renderRating(product.rating)}
                  <span className="ml-2 text-gray-600 text-sm">
                    {product.rating ? `${product.rating.toFixed(1)} rating` : "No ratings yet"}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
              <p className="text-xl text-gray-600 mt-1">{product.shortDescription}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.isSale && (
                  <>
                    <span className="ml-3 text-lg text-gray-400 line-through">
                      ${(product.price * 1.2).toFixed(2)}
                    </span>
                    <span className="ml-3 px-2 py-1 bg-yellow-400 text-white text-sm font-bold rounded">
                      SALE
                    </span>
                  </>
                )}
                {product.isNew && (
                  <span className="ml-3 px-2 py-1 bg-primary text-white text-sm font-bold rounded">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">All prices include VAT.</p>
              <div className="flex items-center mt-4">
                <div className={`w-4 h-4 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"} mr-2`}></div>
                <span className={product.inStock ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-gray-600">Free shipping from $50</span>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex">
                <div className="flex items-center border rounded-md w-32">
                  <button 
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        handleQuantityChange(val);
                      }
                    }}
                    className="w-12 text-center focus:outline-none"
                  />
                  <button
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    +
                  </button>
                </div>
                {product.inStock && (
                  <span className="ml-3 text-gray-500 self-center">
                    {product.inStock ? "Available for purchase" : "Currently unavailable"}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mb-8">
              <Button 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                Add to Cart
              </Button>
              <Button 
                variant="outline" 
                className="w-12 h-12 p-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Button>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <div className="mb-6">
                <h3 className="font-medium mb-2">Product Details</h3>
                <p className="text-gray-600">
                  {product.description}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button className="text-gray-500 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button className="text-gray-500 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Add to Wishlist
                  </button>
                </div>
                <div className="flex items-center text-gray-500">
                  <span>SKU: PROD-{product.id.toString().padStart(4, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && <CartSidebar />}
    </section>
  );
}
