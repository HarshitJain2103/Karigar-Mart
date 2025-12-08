import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/home" className="hover:underline">{t('footer.home')}</a></li>
              <li><a href="/shop" className="hover:underline">{t('footer.shop')}</a></li>
              <li><a href="/artisans" className="hover:underline">{t('footer.artisans')}</a></li>
              <li><a href="/stories" className="hover:underline">{t('footer.stories')}</a></li>
              <li><a href="/contact" className="hover:underline">{t('footer.contact')}</a></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">{t('footer.followUs')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:underline">{t('footer.instagram')}</a></li>
              <li><a href="#" className="hover:underline">{t('footer.youtube')}</a></li>
              <li><a href="#" className="hover:underline">{t('footer.twitter')}</a></li>
              <li><a href="#" className="hover:underline">{t('footer.facebook')}</a></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">{t('footer.payments')}</h4>
            <p className="text-sm text-muted-foreground">{t('footer.paymentMethods')}</p>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:underline">{t('footer.terms')}</a></li>
              <li><a href="#" className="hover:underline">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:underline">{t('footer.refunds')}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Karigar Mart. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  )
}

export default Footer;