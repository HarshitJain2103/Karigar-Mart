import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import useAuthStore from '@/stores/authStore'; 
import { ShoppingCart, Heart, User, Globe, Search, Mic, Store, Languages, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AuthDialog from '@/components/ui/auth/AuthDialog';


export default function Header({ cartCount, query, setQuery, setLang, startVoiceSearch }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Categories", path: "/categories" },
    { name: "Artisans", path: "/artisans" },
    { name: "Stories", path: "/stories" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3 py-3">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <nav className="mt-8 grid gap-4 text-lg">
                  {[...navItems, { name: user?.role === 'ARTISAN' ? "My Dashboard" : "Build your store", path: user?.role === 'ARTISAN' ? "/dashboard" : "/build-store" }].map((item) => (
                    <Link key={item.name} to={item.path} className="hover:underline">{item.name}</Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-4"><Store className="h-6 w-6" /><span className="font-semibold">Karigar Mart</span></Link>

          {/* Secondary Nav (Desktop) */}
          <nav className="hidden items-center justify-center gap-6 text-sm lg:flex">
            {navItems.map((item) => (
              <Link key={item.name} to={item.path} className="text-muted-foreground hover:text-foreground">{item.name}</Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden flex-1 items-center justify-center lg:flex px-8">
            <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, crafts, or artisans" className="border-0 focus-visible:ring-0" />
              <Button variant="ghost" size="icon" onClick={startVoiceSearch} aria-label="Voice search"><Mic className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Wishlist"><Heart className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" aria-label="Cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <Badge className="absolute -right-1 -top-1 rounded-full px-1.5 text-[10px]">{cartCount}</Badge>}
            </Button>

            {/* Conditional Auth Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User Profile"><User className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Hi, {user.firstName}!</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>My Orders</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Profile/Login"><User className="h-5 w-5" /></Button>
                </DialogTrigger>
                <AuthDialog setOpen={setIsDialogOpen} />
              </Dialog>
            )}

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Language"><Globe className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel><div className="flex items-center gap-2"><Languages className="h-4 w-4"/> Language</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["English", "हिन्दी", "বাংলা", "தமிழ்", "తెలుగు", "मराठी"].map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLang(l)}>{l}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden md:block">
              {user && user.role === 'ARTISAN' ? (
                <Link to="/dashboard">
                  <Button className="ml-2">My Dashboard</Button>
                </Link>
              ) : (
                <Link to="/build-store">
                  <Button className="ml-2">Build your store</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}