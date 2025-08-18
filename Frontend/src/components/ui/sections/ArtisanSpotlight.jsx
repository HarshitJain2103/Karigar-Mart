// src/components/sections/ArtisanSpotlight.jsx
import React from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArtisanSpotlight({ artisans }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Artisan Spotlight</h3>
        <a href="#" className="text-sm text-primary hover:underline">See all artisans</a>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {artisans.map((a) => (
          <Card key={a.id} className="overflow-hidden rounded-3xl">
            <div className="grid gap-0 md:grid-cols-2">
              <img src={a.img} alt={a.name} className="h-56 w-full object-cover md:h-full" />
              <CardContent className="flex flex-col justify-center gap-3 p-6">
                <CardTitle className="text-2xl">{a.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{a.location}</p>
                <p className="text-sm">Craft: <span className="font-medium">{a.craft}</span></p>
                <div className="flex gap-3 pt-2">
                  <Button className="rounded-full">View Store</Button>
                  <Button variant="secondary" className="rounded-full">Follow</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}