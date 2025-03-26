import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSidebar from "../cart-sidebar";
import SearchBar from "../search-bar";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { openCart, totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleSearch = (query: string) => {
    console.log("Search:", query);
    // In a real implementation, this would update the search query state
    // and trigger a search request
    setMobileSearchOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">ShopEase</span>
          </Link>

          {/* Desktop Search */}
          <div className="relative hidden md:block flex-1 max-w-xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-primary font-medium">
              Home
            </Link>

            <div className="relative group">
              <button className="text-gray-600 hover:text-primary font-medium flex items-center">
                Categories
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="hidden group-hover:block absolute top-full left-0 w-64 bg-white shadow-lg rounded-md mt-2 p-4 z-20">
                <div className="space-y-2">
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Electronics
                  </Link>
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Clothing
                  </Link>
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Home & Furniture
                  </Link>
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Beauty
                  </Link>
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Sports & Outdoors
                  </Link>
                  <Link href="/" className="block p-2 hover:bg-gray-50 rounded">
                    Books
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/" className="text-gray-600 hover:text-primary font-medium">
              Deals
            </Link>
            <Link href="/" className="text-gray-600 hover:text-primary font-medium">
              About
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Orders</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  {user.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <div className="py-3 md:hidden">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="py-4 md:hidden space-y-4">
            <Link
              href="/"
              className="block text-gray-600 hover:text-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <div>
              <button className="flex items-center justify-between w-full text-gray-600 hover:text-primary font-medium">
                Categories
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="mt-2 pl-4 space-y-2">
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Electronics
                </Link>
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Clothing
                </Link>
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home & Furniture
                </Link>
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Beauty
                </Link>
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sports & Outdoors
                </Link>
                <Link
                  href="/"
                  className="block p-2 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Books
                </Link>
              </div>
            </div>
            <Link
              href="/"
              className="block text-gray-600 hover:text-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Deals
            </Link>
            <Link
              href="/"
              className="block text-gray-600 hover:text-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>

            {!user && (
              <Link
                href="/auth"
                className="block text-gray-600 hover:text-primary font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In / Register
              </Link>
            )}

            {user && (
              <>
                <Link
                  href="/"
                  className="block text-gray-600 hover:text-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  className="block w-full text-left text-red-600 hover:text-red-800 font-medium"
                  onClick={() => {
                    logoutMutation.mutate();
                    setMobileMenuOpen(false);
                  }}
                >
                  Log Out
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
