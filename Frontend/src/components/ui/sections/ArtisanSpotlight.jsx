import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export default function ArtisanSpotlight({ artisans }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">Artisan Spotlight</h3>
        <Link to="/artisans" className="text-sm font-medium text-primary">
          See all artisans
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {artisans.map((a) => (
          <Link key={a._id} to={`/store/${a._id}`} className="group block">
            <Card className="overflow-hidden rounded-xl border-2 transition-all duration-300">
              <div className="relative h-56 w-full">
                <img 
                  src={a.media.heroImageURL} 
                  alt={a.storeName} 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h4 className="text-2xl font-bold drop-shadow-md">{a.storeName}</h4>
                  <p className="text-sm text-white/90 drop-shadow-md">{a.address.city}, {a.address.state}</p>
                </div>
              </div>
              <CardContent className="p-4 bg-white">
                <p className="text-sm text-muted-foreground italic truncate">"{a.tagline || 'Handcrafted with love'}"</p>
                <div className="mt-4 flex gap-2">
                    <Button className="w-full">View Store</Button>
                    <Button variant="secondary" className="w-full">Follow</Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}