import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { WarliDivider } from "@/components/decorative/indianpattern";

function Footer() {
  const { t } = useTranslation();

 return (
  <footer className="relative overflow-hidden bg-accent text-accent-foreground">
    <WarliDivider />

    {/* Lovable style decorative background */}
    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10" />
    <div className="absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-primary/10" />

    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">

      {/* Main Grid */}
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div className="text-center sm:text-left">
          <h3 className="mb-3 font-heading text-xl font-bold">Karigar Mart</h3>
          <p className="font-body text-sm opacity-80 leading-relaxed">
            Empowering Indian rural artisans by bringing their handcrafted creations to the world. 🇮🇳
          </p>
          <p className="mt-3 font-body text-xs font-bold opacity-60">
            भारत के कारीगरों को सशक्त बनाना
          </p>
        </div>

        {/* Quick Links */}
        <div className="text-center sm:text-left">
          <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">
            {t('footer.quickLinks')}
          </h4>
          <ul className="space-y-2">
            <li><a href="/home" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.home')}</a></li>
            <li><a href="/shop" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.shop')}</a></li>
            <li><a href="/artisans" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.artisans')}</a></li>
            <li><a href="/stories" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.stories')}</a></li>
            <li><a href="/contact" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.contact')}</a></li>
          </ul>
        </div>

        {/* Social */}
        <div className="text-center sm:text-left">
          <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">
            {t('footer.followUs')}
          </h4>
          <ul className="space-y-2">
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.instagram')}</a></li>
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.youtube')}</a></li>
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.twitter')}</a></li>
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.facebook')}</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="text-center sm:text-left">
          <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">
            {t('footer.legal')}
          </h4>
          <ul className="space-y-2">
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.terms')}</a></li>
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.privacy')}</a></li>
            <li><a href="#" className="font-body text-sm opacity-70 transition-all hover:opacity-100 hover:translate-x-1">{t('footer.refunds')}</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-accent-foreground/20 pt-6 text-center">
        <p className="font-body text-sm opacity-60">
          © {new Date().getFullYear()} Karigar Mart. {t('footer.rights')} | UPI • PhonePe • Paytm • COD Available
        </p>
      </div>

    </div>
  </footer>
);

 
}

export default Footer;