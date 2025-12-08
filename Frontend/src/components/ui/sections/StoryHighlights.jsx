import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function StoryHighlights({ stories }) {
  const { t } = useTranslation();

  if (!stories || stories.length === 0) {
    return null; // Don't render the section if there are no stories
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t('storyHighlights.title')}</h3>
        {/* This link would go to a future page showing all stories */}
        <Link to="/stories" className="text-sm text-primary hover:underline">{t('storyHighlights.readAll')}</Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stories.map((s) => (
          // Use the unique _id from the database for the key
          <Card key={s._id} className="overflow-hidden rounded-2xl flex flex-col">
            <Link to={`/store/${s.artisanId._id}#story`}>
              <div className="aspect-video overflow-hidden">
                <img src={s.imageURL} alt={s.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
              </div>
            </Link>
            <CardHeader>
              <CardTitle className="line-clamp-1">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <p className="line-clamp-3 text-sm text-muted-foreground flex-grow">{s.excerpt}</p>
              <div className="pt-3 mt-auto">
                {/* This link now works correctly because s.artisanId._id is defined */}
                <Link to={`/store/${s.artisanId._id}`}>
                  <Button variant="link" className="px-0">{t('storyHighlights.readMore')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}