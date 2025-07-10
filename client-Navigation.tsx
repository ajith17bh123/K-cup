import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const { cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", page: "/" },
    { href: "/products", label: "Products", page: "/products" },
    { href: "/customize", label: "Customize", page: "/customize" },
    { href: "/admin", label: "Admin", page: "/admin" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold coffee-text-gradient">K-Cup</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive(item.page) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button className="btn-coffee relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${isActive(item.page) ? 'active' : ''}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
