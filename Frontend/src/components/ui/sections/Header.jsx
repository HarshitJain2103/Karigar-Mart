import React, { useState } from 'react';
import {
  ShoppingCart, Heart, User, Globe, Search, Mic, Store, Languages, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

// --- UPDATED IMPORTS ---
// We import the global state store
import useAuthStore from '@/stores/authStore';
// Correct the path to the AuthDialog component
import AuthDialog from '@/components/ui/auth/AuthDialog';


export default function Header({
  cartCount, query, setQuery, setLang, startVoiceSearch
}) {
  // --- STATE MANAGEMENT UPDATES ---
  // 1. Get the real user and logout function from our global store
  const { user, logout } = useAuthStore();
  
  // 2. Add a local state to control ONLY the open/closed state of the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // No more isLoggedIn or mock user data is needed here!

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Artisans", path: "/artisans" },
    { name: "Stories", path: "/stories" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3 py-3">
          {/* Mobile menu, Logo, Search Bar ... (no changes here) */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <nav className="mt-8 grid gap-4 text-lg">
                  {[...navItems, { name: "Build your store", path: "/build-store" }].map((item) => (
                    <Link key={item.name} to={item.path} className="hover:underline">{item.name}</Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Link to="/" className="flex items-center gap-2"><Store className="h-6 w-6" /><span className="font-semibold">Karigar Mart</span></Link>
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, craft, material, location" className="border-0 focus-visible:ring-0" />
              <Button variant="ghost" size="icon" onClick={startVoiceSearch} aria-label="Voice search"><Mic className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Wishlist"><Heart className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" aria-label="Cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <Badge className="absolute -right-1 -top-1 rounded-full px-1.5 text-[10px]">{cartCount}</Badge>}
            </Button>

            {/* --- UPDATED CONDITIONAL AUTH BUTTON --- */}
            {user ? (
              // If user object exists in our store, they are LOGGED IN
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User Profile">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Hi, {user.firstName}!</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>My Orders</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}> {/* Use logout from store */}
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // If user is null, they are LOGGED OUT
              // This is now a controlled dialog
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Profile/Login">
                    <User className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                {/* We pass the setter function to the dialog so it can close itself */}
                <AuthDialog setOpen={setIsDialogOpen} />
              </Dialog>
            )}

            {/* Language Selector */}
            <DropdownMenu>
              {/* ... (no changes to language selector) ... */}
            </DropdownMenu>

            <div className="hidden md:block">
              <Link to="/build-store">
                <Button className="ml-2 rounded-full">Build your store</Button>
              </Link>
            </div>
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-6 pb-3 text-sm lg:flex">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} className="text-muted-foreground hover:text-foreground">{item.name}</Link>
          ))}
        </nav>
        
        <div className="pb-3 lg:hidden">
          {/* ... (no changes to mobile search) ... */}
        </div>
      </div>
    </header>
  );
}
