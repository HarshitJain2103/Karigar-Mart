import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function ArtisanSpotlight({ artisans }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">{t('artisanSpotlight.title')}</h3>
        <Link to="/artisans" className="text-sm font-medium text-primary">
          {t('artisanSpotlight.seeAll')}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {artisans.map((a) => (
          <Link key={a._id} to={`/store/${a._id}`} className="group block">
            <Card className="overflow-hidden rounded-2xl flex flex-col">
              <div className="aspect-video overflow-hidden">
                <img
                  src={a.media.heroImageURL}
                  alt={a.storeName}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{a.storeName}</CardTitle>
                <p className="text-sm text-muted-foreground">{a.address.city}, {a.address.state}</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground italic truncate flex-grow">"{a.tagline || t('artisanSpotlight.defaultTagline')}"</p>
                <div className="pt-3 mt-auto flex gap-2">
                  <Button className="w-full">{t('artisanSpotlight.viewStore')}</Button>
                  <Button variant="secondary" className="w-full">{t('artisanSpotlight.follow')}</Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}