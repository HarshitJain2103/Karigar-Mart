// src/components/sections/StoryHighlights.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StoryHighlights({ stories }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Stories & Culture</h3>
        <a href="#" className="text-sm text-primary hover:underline">Read all</a>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stories.map((s) => (
          <Card key={s.id} className="overflow-hidden rounded-2xl">
            <img src={s.img} alt={s.title} className="h-40 w-full object-cover" />
            <CardHeader>
              <CardTitle className="line-clamp-1">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">{s.excerpt}</p>
              <div className="pt-3">
                <Button variant="link" className="px-0">Read More</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}