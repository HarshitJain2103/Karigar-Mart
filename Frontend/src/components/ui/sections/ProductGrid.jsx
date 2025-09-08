import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart } from "lucide-react";

export default function ProductGrid({ title, subtitle, link, products, onAddToCart }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        {subtitle ? (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        ) : (
          <a href="#" className="text-sm text-primary hover:underline">{link || "See more"}</a>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <Card key={p._id} className="overflow-hidden rounded-2xl">
            <div className="relative">
              <img src={p.imageURLs[0]} alt={p.title} className="h-40 w-full object-cover" />
              <Button
                variant="secondary"
                className="absolute right-2 top-2 h-8 w-8 rounded-full p-0"
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="space-y-2 p-3">
              <a href="#" className="line-clamp-1 font-medium hover:underline">{p.title}</a>
              <div className="flex items-center justify-between">
                <span className="font-semibold">₹{p.price}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="flex-1 rounded-full" onClick={onAddToCart}>Add to Cart</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="rounded-full">Quick View</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                      <DialogTitle>{p.title}</DialogTitle>
                      <DialogDescription>{/* by {p.artisan.storeName} */}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-2">
                      <img src={p.imageURLs[0]} alt={p.title} className="h-48 w-full rounded-xl object-cover" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">₹{p.price}</span>
                          <Button className="rounded-full" onClick={onAddToCart}>Buy Now</Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}