// src/components/sections/Newsletter.jsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function Newsletter() {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(t('newsletter.subscribedSuccess'));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-r from-muted to-background p-6 md:p-10">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">{t('newsletter.title')}</h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {t('newsletter.description')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input type="email" placeholder={t('newsletter.placeholder')} required className="h-11 rounded-full" />
            <Button type="submit" className="h-11 rounded-full">{t('newsletter.subscribe')}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}