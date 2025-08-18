// src/components/sections/Newsletter.jsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Newsletter() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Subscribed! ✨");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-r from-muted to-background p-6 md:p-10">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">Stay in the loop</h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Subscribe for exclusive offers, early access to limited editions, and the stories behind the crafts.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input type="email" placeholder="Enter your email" required className="h-11 rounded-full" />
            <Button type="submit" className="h-11 rounded-full">Subscribe</Button>
          </form>
        </div>
      </div>
    </section>
  );
}